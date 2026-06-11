/**
 * CCP's public image server — no auth, no rate limit drama.
 * https://images.evetech.net serves portraits, logos, and ship renders.
 */

const IMAGE_BASE = "https://images.evetech.net";

export function characterPortraitUrl(characterId: number, size: 64 | 128 | 256 | 512 = 256): string {
  return `${IMAGE_BASE}/characters/${characterId}/portrait?size=${size}`;
}

export function typeRenderUrl(typeId: number, size: 64 | 128 | 256 | 512 = 128): string {
  return `${IMAGE_BASE}/types/${typeId}/render?size=${size}`;
}

export function corporationLogoUrl(corporationId: number, size: 64 | 128 | 256 = 128): string {
  return `${IMAGE_BASE}/corporations/${corporationId}/logo?size=${size}`;
}
