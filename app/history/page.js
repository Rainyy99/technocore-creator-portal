"use client";

import { useState, useEffect } from "react";
import { loadHistory } from "../../lib/storage";
import { readRoom } from "../../lib/technocore";
import ProofCard from "../../components/ProofCard";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");

  useEffect(() => { setHistory(loadHistory()); }, []);

  async function verifyAll() {
    setVerifying(true); setVerifyMsg("");
    try {
      const rooms = [...new Set(history.map((h) => h.room))];
      let foundCount = 0;
      for (const room of rooms) {
        const data = await readRoom(room);
        const seqs = new Set((data.messages || data || []).map((m) => m.seq));
        history.forEach((h) => { if (h.room === room && seqs.has(h.seq)) foundCount += 1; });
      }
      setVerifyMsg(`${foundCount} dari ${history.length} entri terkonfirmasi masih ada di room publik.`);
    } catch (e) { setVerifyMsg("Gagal verifikasi: " + e.message); } finally { setVerifying(false); }
  }

  if (history.length === 0) {
    return (<div className="empty"><p>Belum ada riwayat.</p><p className="muted">Check-in atau submit karya dulu di tab lain.</p></div>);
  }

  return (
    <div>
      <h1>Riwayat Saya</h1>
      <button className="btn-secondary" style={{ width: "100%", marginBottom: 16 }} disabled={verifying} onClick={verifyAll}>{verifying ? "Memverifikasi…" : "Verifikasi Ulang ke Technocore"}</button>
      {verifyMsg && <div className="status-ok">{verifyMsg}</div>}
      {history.map((entry, i) => (<ProofCard key={`${entry.room}-${entry.seq}-${i}`} entry={entry} />))}
    </div>
  );
}
