/**
 * AES-256-GCM encryption for deployment credentials at rest (Cloudflare API tokens, customers'
 * email keys). The key is a Worker secret (ENCRYPTION_KEY, base64 of 32 random bytes).
 */
const b64 = (u: Uint8Array) => {
  let s = "";
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function key(secret: string) {
  let raw: Uint8Array;
  try {
    raw = unb64(secret);
  } catch {
    raw = new Uint8Array(0);
  }
  if (raw.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 random bytes, base64-encoded (openssl rand -base64 32).");
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(secret: string, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(secret), new TextEncoder().encode(plaintext)));
  return `v1.${b64(iv)}.${b64(ct)}`;
}

export async function decryptSecret(secret: string, sealed: string): Promise<string> {
  const [v, iv, ct] = sealed.split(".");
  if (v !== "v1" || !iv || !ct) throw new Error("Unrecognized encrypted value.");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(secret), unb64(ct));
  return new TextDecoder().decode(pt);
}
