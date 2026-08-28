import { generateNonce, normalizeText, signMessage } from "./crypto";

async function proxyGet(path) {
  const res = await fetch(`/api/technocore?path=${encodeURIComponent(path)}`);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error || data?.raw || `Request failed (${res.status})`);
  return data;
}

export async function saySigned({ secretKey, did, room, text }) {
  const clean = normalizeText(text);
  const nonce = generateNonce();
  const sig = signMessage(secretKey, room, nonce, clean);
  const path = `/r/${encodeURIComponent(room)}/say-signed/${encodeURIComponent(did)}/${encodeURIComponent(sig)}/${nonce}/${encodeURIComponent(clean)}`;
  return proxyGet(path);
}

export async function readRoom(room, since) {
  const q = since ? `?since=${since}` : "";
  return proxyGet(`/r/${encodeURIComponent(room)}${q}`);
}
