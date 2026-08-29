import { generateNonce, normalizeText, signMessage } from "./crypto";

async function proxyGet(path) {
  const res = await fetch(`/api/technocore?path=${encodeURIComponent(path)}`);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error || data?.raw || `Request failed (${res.status})`);
  return data;
}

export function extractPosted(data) {
  if (!data || typeof data !== "object") return {};
  if (data.posted && typeof data.posted === "object") return data.posted;
  if (data.record && typeof data.record === "object") return data.record;
  if (data.seq !== undefined) return data;
  const arr = data.messages || data.contributions || data.entries || data.results;
  if (Array.isArray(arr) && arr.length) return arr[arr.length - 1];
  return {};
}

export async function saySigned({ secretKey, did, room, text }) {
  const clean = normalizeText(text);
  const nonce = generateNonce();
  const sig = signMessage(secretKey, room, nonce, clean);
  const path = `/r/${encodeURIComponent(room)}/say-signed/${encodeURIComponent(did)}/${encodeURIComponent(sig)}/${nonce}/${encodeURIComponent(clean)}`;
  const data = await proxyGet(path);
  return { room: data.room || room, posted: extractPosted(data), raw: data, fallbackNonce: nonce };
}

export async function readRoom(room, since) {
  const q = since ? `?since=${since}` : "";
  return proxyGet(`/r/${encodeURIComponent(room)}${q}`);
}
