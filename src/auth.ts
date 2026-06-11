/**
 * EVE SSO via OAuth2 PKCE (native-app flow — no client secret).
 * Requires a free app registered at https://developers.eveonline.com with
 * callback URL http://localhost:8484/callback. Set EVE_CLIENT_ID to its ID.
 * Tokens persist in ~/.config/eve-mentor/tokens.json and refresh automatically.
 */

import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";

const SSO_AUTHORIZE_URL = "https://login.eveonline.com/v2/oauth/authorize";
const SSO_TOKEN_URL = "https://login.eveonline.com/v2/oauth/token";
const CALLBACK_PORT = 8484;
// Local listener that actually receives the auth code...
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/callback`;
// ...but CCP's dev portal only accepts https callback URLs, so the registered
// redirect is a static relay page that immediately forwards the query string
// to the local listener. Override with EVE_REDIRECT_URI if self-hosting one.
const REDIRECT_URI = process.env.EVE_REDIRECT_URI ?? "https://ruby-eve.com/callback";
const LOGIN_TIMEOUT_MS = 180_000;
const TOKEN_DIR = join(homedir(), ".config", "eve-mentor");
const TOKEN_FILE = join(TOKEN_DIR, "tokens.json");

export const SCOPES = [
  "esi-skills.read_skills.v1",
  "esi-skills.read_skillqueue.v1",
  "esi-location.read_location.v1",
  "esi-location.read_ship_type.v1",
  "esi-wallet.read_character_wallet.v1",
  "esi-assets.read_assets.v1",
].join(" ");

interface StoredToken {
  characterId: number;
  characterName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function getClientId(): string {
  const clientId = process.env.EVE_CLIENT_ID;
  if (!clientId) {
    throw new AuthError(
      "EVE_CLIENT_ID is not set. Register a free app at https://developers.eveonline.com " +
        `(callback URL: ${REDIRECT_URI}) and set its Client ID in the MCP server env.`,
    );
  }
  return clientId;
}

async function loadToken(): Promise<StoredToken | null> {
  try {
    return JSON.parse(await readFile(TOKEN_FILE, "utf8")) as StoredToken;
  } catch {
    return null;
  }
}

async function saveToken(token: StoredToken): Promise<void> {
  await mkdir(TOKEN_DIR, { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(token, null, 2), { mode: 0o600 });
}

function decodeJwtCharacter(accessToken: string): { id: number; name: string } {
  const payload = JSON.parse(
    Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"),
  ) as { sub: string; name: string };
  // sub format: "CHARACTER:EVE:2112345678"
  const id = Number(payload.sub.split(":")[2]);
  if (!id) throw new AuthError("Could not read character ID from SSO token.");
  return { id, name: payload.name };
}

async function exchangeToken(body: URLSearchParams): Promise<StoredToken> {
  const response = await fetch(SSO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Host: "login.eveonline.com",
    },
    body,
  });
  if (!response.ok) {
    throw new AuthError(`EVE SSO token request failed (${response.status}): ${await response.text()}`);
  }
  const json = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  const character = decodeJwtCharacter(json.access_token);
  return {
    characterId: character.id,
    characterName: character.name,
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

/** Wait for EVE SSO to redirect back to localhost with the auth code. */
function waitForCallback(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", CALLBACK_URL);
      if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h2>Logged in to EVE. You can close this tab and return to Claude.</h2>");
      server.close();
      clearTimeout(timer);
      if (!code || state !== expectedState) {
        reject(new AuthError("SSO callback missing code or state mismatch."));
      } else {
        resolve(code);
      }
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new AuthError(`Timed out after ${LOGIN_TIMEOUT_MS / 1000}s waiting for EVE login.`));
    }, LOGIN_TIMEOUT_MS);
    server.on("error", (err) => {
      clearTimeout(timer);
      reject(new AuthError(`Could not listen on port ${CALLBACK_PORT}: ${err.message}`));
    });
    server.listen(CALLBACK_PORT);
  });
}

/** Run the full browser login flow. Returns the logged-in character name. */
export async function login(): Promise<{ characterName: string; characterId: number }> {
  const clientId = getClientId();
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("base64url");

  const authorizeUrl =
    `${SSO_AUTHORIZE_URL}?response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&client_id=${clientId}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&code_challenge=${challenge}&code_challenge_method=S256` +
    `&state=${state}`;

  const callbackPromise = waitForCallback(state);
  openBrowser(authorizeUrl);
  const code = await callbackPromise;

  const token = await exchangeToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      code_verifier: verifier,
    }),
  );
  await saveToken(token);
  return { characterName: token.characterName, characterId: token.characterId };
}

function openBrowser(url: string): void {
  if (process.platform === "win32") {
    // "start" is a cmd builtin; the empty string is the window title argument.
    execFile("cmd", ["/c", "start", "", url]);
  } else {
    execFile(process.platform === "darwin" ? "open" : "xdg-open", [url]);
  }
}

/** Current login state without touching the network. */
export async function authStatus(): Promise<{
  loggedIn: boolean;
  characterName?: string;
  characterId?: number;
}> {
  const token = await loadToken();
  if (!token) return { loggedIn: false };
  return { loggedIn: true, characterName: token.characterName, characterId: token.characterId };
}

/** Valid access token + character id, refreshing if needed. */
export async function getSession(): Promise<{ accessToken: string; characterId: number }> {
  let token = await loadToken();
  if (!token) {
    throw new AuthError('Not logged in to EVE. Use the "eve_login" tool first.');
  }
  if (token.expiresAt < Date.now() + 60_000) {
    const refreshed = await exchangeToken(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
        client_id: getClientId(),
      }),
    );
    await saveToken(refreshed);
    token = refreshed;
  }
  return { accessToken: token.accessToken, characterId: token.characterId };
}
