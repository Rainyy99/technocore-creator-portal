"use client";

import { useState } from "react";
import { useIdentity } from "../../lib/IdentityContext";
import { saySigned } from "../../lib/technocore";
import { appendHistory } from "../../lib/storage";
import ProofCard from "../../components/ProofCard";

const CONTENT_TYPES = ["Thread X", "Video", "Artikel", "Infografis", "Terjemahan", "Lainnya"];

export default function SubmitPage() {
  const { hasStoredIdentity, unlocked, unlock, secretKey, did } = useIdentity();
  const [passphrase, setPassphrase] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("Bahasa Indonesia");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!url.trim()) { setError("Link post wajib diisi."); return; }
    if (!summary.trim()) { setError("Ringkasan singkat wajib diisi."); return; }
    setBusy(true);
    try {
      let key = secretKey; let activeDid = did;
      if (!unlocked) { const res = await unlock(passphrase); key = res.secretKey; activeDid = res.did; }
      const text = `[${contentType} · ${language}] I published a Technocore contribution: ${url}. ${summary}`;
      const response = await saySigned({ secretKey: key, did: activeDid, room: "technocore", text });
      const p = response.posted || {};
      const entry = {
        kind: "submission", room: response.room || "technocore",
        seq: p.seq ?? null,
        did: p.from || activeDid,
        nonce: p.nonce ?? response.fallbackNonce,
        ts: p.ts || new Date().toISOString(),
        text: p.text || text,
        url, contentType, language, raw: response.raw, createdAt: Date.now(),
      };
      appendHistory(entry);
      setResult(entry); setUrl(""); setSummary("");
    } catch (err) { setError("Submit gagal: " + err.message); } finally { setBusy(false); }
  }

  if (!hasStoredIdentity) {
    return (<div className="empty"><p>Kamu belum punya identitas.</p><p className="muted">Buka tab Mulai untuk membuat identitas dulu.</p></div>);
  }

  return (
    <div>
      <h1>Submit Karya</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Kirim link kontribusi kamu — tercatat permanen dan bisa diverifikasi siapa saja.</p>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label>Jenis konten</label>
          <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
            {CONTENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div className="field">
          <label>Link post</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://x.com/username/status/..." />
        </div>
        <div className="field">
          <label>Bahasa konten</label>
          <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Bahasa Indonesia" />
        </div>
        <div className="field">
          <label>Ringkasan singkat</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Menjelaskan apa itu Technocore untuk pemula" />
        </div>
        {!unlocked && (
          <div className="field">
            <label>Passphrase identitas kamu</label>
            <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="Masukkan passphrase untuk menandatangani submission" />
          </div>
        )}
        {error && <div className="status-error">{error}</div>}
        <button className="btn-primary" disabled={busy} type="submit">{busy ? "Mengirim…" : "Kirim Kontribusi"}</button>
      </form>
      {result && (<div><h2 style={{ fontSize: 16 }}>Bukti kontribusi</h2><ProofCard entry={result} /></div>)}
    </div>
  );
}
