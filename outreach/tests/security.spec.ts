import { expect, test } from "@playwright/test";
import { checkCsrf, csrfToken, verifyAccessJwt } from "../src/security";
import { testConfig } from "./helpers";

const b64url = (s: string | Uint8Array) =>
  Buffer.from(typeof s === "string" ? s : s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function setup() {
  const pair = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };
  const fetchFn = (async () => new Response(JSON.stringify({ keys: [jwk] }))) as unknown as typeof fetch;
  const sign = async (payload: Record<string, unknown>, kid = "k1") => {
    const h = b64url(JSON.stringify({ alg: "RS256", kid }));
    const p = b64url(JSON.stringify(payload));
    const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(`${h}.${p}`)));
    return `${h}.${p}.${b64url(sig)}`;
  };
  return { fetchFn, sign };
}

const env = { ACCESS_TEAM_DOMAIN: "maison.cloudflareaccess.com", ACCESS_AUD: "aud-123" };
const good = () => ({ aud: ["aud-123"], iss: "https://maison.cloudflareaccess.com", exp: Math.floor(Date.now() / 1000) + 600, email: "Owner@Example.org" });

test("Cloudflare Access JWT: valid tokens pass; wrong audience, issuer, expiry or signature fail", async () => {
  const { fetchFn, sign } = await setup();
  expect(await verifyAccessJwt(await sign(good()), env, fetchFn)).toBe("owner@example.org");
  expect(await verifyAccessJwt(await sign({ ...good(), aud: ["other"] }), env, fetchFn)).toBeNull();
  expect(await verifyAccessJwt(await sign({ ...good(), iss: "https://evil.cloudflareaccess.com" }), env, fetchFn)).toBeNull();
  expect(await verifyAccessJwt(await sign({ ...good(), exp: 1 }), env, fetchFn)).toBeNull();
  const t = await sign(good());
  const tampered = t.split(".");
  tampered[1] = b64url(JSON.stringify({ ...good(), email: "attacker@example.org" }));
  expect(await verifyAccessJwt(tampered.join("."), env, fetchFn)).toBeNull();
  expect(await verifyAccessJwt("not.a.jwt", env, fetchFn)).toBeNull();
  expect(await verifyAccessJwt(await sign(good()), { ...env, ACCESS_AUD: "" }, fetchFn)).toBeNull();
});

test("CSRF tokens are bound to the admin", async () => {
  const config = testConfig();
  const token = await csrfToken(config, "owner@example.org");
  expect(await checkCsrf(config, "owner@example.org", token)).toBe(true);
  expect(await checkCsrf(config, "someone@example.org", token)).toBe(false);
  expect(await checkCsrf(config, "owner@example.org", null)).toBe(false);
  expect(await checkCsrf({ ...config, appSecret: "different-secret-0123456789abcdef" }, "owner@example.org", token)).toBe(false);
});
