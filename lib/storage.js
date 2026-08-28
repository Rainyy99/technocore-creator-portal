const STORAGE_KEY = "technocore_identity_v1";
const HISTORY_KEY = "technocore_history_v1";

function b64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}
function fromB64(str) {
  return new Uint8Array(atob(str).split("").map((c) => c.charCodeAt(0)));
}

async function deriveAesKey(passphrase, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}

export async function encryptSecretKey(secretKey, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, secretKey);
  return { salt: b64(salt), iv: b64(iv), ciphertext: b64(new Uint8Array(ciphertext)) };
}

export async function decryptSecretKey(enc, passphrase) {
  const salt = fromB64(enc.salt);
  const iv = fromB64(enc.iv);
  const aesKey = await deriveAesKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, fromB64(enc.ciphertext));
  return new Uint8Array(plain);
}

export function saveIdentity({ did, enc }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ did, enc, createdAt: Date.now() }));
}

export function loadIdentity() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadBackup(identity) {
  const blob = new Blob([JSON.stringify(identity, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `technocore-identity-backup.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function loadHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function appendHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
  return history;
}
