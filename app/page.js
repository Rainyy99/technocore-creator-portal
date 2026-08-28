"use client";

import { useState } from "react";
import { generateKeypair, didFromSecretKey, didFingerprintPath, signNote, generateNonce } from "../lib/crypto";
import { encryptSecretKey, saveIdentity, downloadBackup } from "../lib/storage";
import { useIdentity } from "../lib/IdentityContext";

export default function HomePage() {
  const { hasStoredIdentity, did, refreshHasStoredIdentity, unlock } = useIdentity();
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [step, setStep] = useState("idle");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  async function handleCreate() {
    setError("");
    if (passphrase.length < 12) { setError("Passphrase minimal 12 karakter."); return; }
    if (passphrase !== confirmPassphrase) { setError("Passphrase dan konfirmasi tidak sama."); return; }
    try {
      const { secretKey } = generateKeypair();
      const newDid = didFromSecretKey(secretKey);
      const enc = await encryptSecretKey(secretKey, passphrase);
      const identity = { did: newDid, enc };
      saveIdentity(identity);
      downloadBackup(identity);
      refreshHasStoredIdentity();
      setStep("created");
    } catch (e) {
      setError("Gagal membuat identitas: " + e.message);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError("");
    try {
      const { did: unlockedDid, secretKey } = await unlock(passphrase || confirmPassphrase);
      const { ns, key } = await didFingerprintPath(unlockedDid);
      const nonce = generateNonce();
      signNote(secretKey, ns, key, nonce, unlockedDid);
      const path = `/kv/${ns}/${key}/set/${encodeURIComponent(unlockedDid)}`;
      const res = await fetch(`/api/technocore?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Publish gagal (" + res.status + ")");
      setPublished(true);
    } catch (e) {
      setError("Gagal publish: " + e.message);
    } finally {
      setPublishing(false);
    }
  }

  if (hasStoredIdentity && step !== "created") {
    return (
      <div>
        <h1>Kamu sudah punya identitas</h1>
        <div className="card">
          <p className="muted">DID kamu:</p>
          <p className="mono" style={{ wordBreak: "break-all" }}>{did}</p>
        </div>
        <p className="muted">Lanjut ke tab <strong>Check-in</strong> untuk menandai kehadiran hari ini, atau <strong>Submit Karya</strong> untuk mengirim link kontribusi kamu.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Buat Identitas Kamu</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Identitas ini dibuat langsung di perangkat kamu — tidak pernah dikirim ke server mana pun. Kamu yang memegang kendali penuh.</p>

      {step === "idle" && (
        <div className="card">
          <div className="field">
            <label>Buat passphrase (minimal 12 karakter)</label>
            <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="Passphrase untuk mengunci identitas kamu" />
          </div>
          <div className="field">
            <label>Ulangi passphrase</label>
            <input type="password" value={confirmPassphrase} onChange={(e) => setConfirmPassphrase(e.target.value)} placeholder="Ketik ulang passphrase yang sama" />
          </div>
          {error && <div className="status-error">{error}</div>}
          <button className="btn-primary" onClick={handleCreate}>Buat Identitas Saya</button>
        </div>
      )}

      {step === "created" && (
        <div>
          <div className="status-ok">Identitas berhasil dibuat dan file backup sudah terdownload.</div>
          <div className="card">
            <p className="muted">DID kamu:</p>
            <p className="mono" style={{ wordBreak: "break-all" }}>{did}</p>
          </div>
          <div className="card">
            <strong>Penting — simpan file backup itu.</strong>
            <p className="muted" style={{ marginTop: 8 }}>File <span className="mono">technocore-identity-backup.json</span> yang baru saja terdownload adalah satu-satunya cara memulihkan identitas ini. Kalau kamu menghapus data browser atau ganti perangkat tanpa file ini, identitas kamu <strong>hilang selamanya</strong> dan tidak bisa dipulihkan siapa pun, termasuk kami. Simpan di tempat aman.</p>
          </div>
          <div className="card">
            <strong>Opsional: publikasikan DID kamu</strong>
            <p className="muted" style={{ margin: "8px 0 12px" }}>Ini menyimpan DID kamu di catatan publik Technocore, di lokasi standar yang bisa ditemukan orang lain — tidak wajib.</p>
            {published ? (<div className="status-ok">Berhasil dipublikasikan.</div>) : (
              <button className="btn-secondary" disabled={publishing} onClick={handlePublish}>{publishing ? "Mempublikasikan…" : "Publikasikan DID"}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
