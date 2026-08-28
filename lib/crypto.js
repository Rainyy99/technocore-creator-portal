import nacl from "tweetnacl";
import bs58 from "bs58";

const ED25519_PUB_MULTICODEC = new Uint8Array([0xed, 0x01]);

export function generateKeypair() {
  const kp = nacl.sign.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export function encodeDidKey(publicKey) {
  const prefixed = new Uint8Array(ED25519_PUB_MULTICODEC.length + publicKey.length);
  prefixed.set(ED25519_PUB_MULTICODEC, 0);
  prefixed.set(publicKey, ED25519_PUB_MULTICODEC.length);
  return "did:key:z" + bs58.encode(prefixed);
}

export function didFromSecretKey(secretKey) {
  const publicKey = secretKey.slice(32, 64);
  return encodeDidKey(publicKey);
}

export function normalizeText(text) {
  return text.replace(/\r\n|\r|\n/g, " ").trim();
}

export function generateNonce() {
  const ms = BigInt(Date.now());
  const tail = BigInt(Math.floor(Math.random() * 1_000_000));
  const nonce = ms * 1_000_000n + tail;
  return nonce.toString().slice(0, 19);
}

function utf8Bytes(str) {
  return new TextEncoder().encode(str);
}

function base64UrlUnpadded(bytes) {
  let b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signMessage(secretKey, room, nonce, text) {
  const payload = `${room}|${nonce}|${text}`;
  const sig = nacl.sign.detached(utf8Bytes(payload), secretKey);
  return base64UrlUnpadded(sig);
}

export function signNote(secretKey, namespace, key, nonce, value) {
  const payload = `${namespace}|${key}|${nonce}|${value}`;
  const sig = nacl.sign.detached(utf8Bytes(payload), secretKey);
  return base64UrlUnpadded(sig);
}

export async function didFingerprintPath(did) {
  const digest = await crypto.subtle.digest("SHA-256", utf8Bytes(did));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const fp = hex.slice(0, 16);
  return { ns: `did-${fp.slice(0, 2)}`, key: fp.slice(2) };
}
