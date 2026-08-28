"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { loadIdentity, decryptSecretKey } from "./storage";

const IdentityContext = createContext(null);

export function IdentityProvider({ children }) {
  const [did, setDid] = useState(null);
  const [secretKey, setSecretKey] = useState(null);
  const [hasStoredIdentity, setHasStoredIdentity] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const stored = loadIdentity();
    setHasStoredIdentity(!!stored);
    if (stored) setDid(stored.did);
  }, []);

  const unlock = useCallback(async (passphrase) => {
    const stored = loadIdentity();
    if (!stored) throw new Error("Belum ada identitas tersimpan di perangkat ini.");
    const key = await decryptSecretKey(stored.enc, passphrase);
    setSecretKey(key);
    setDid(stored.did);
    setUnlocked(true);
    return { did: stored.did, secretKey: key };
  }, []);

  const lock = useCallback(() => {
    setSecretKey(null);
    setUnlocked(false);
  }, []);

  const refreshHasStoredIdentity = useCallback(() => {
    const stored = loadIdentity();
    setHasStoredIdentity(!!stored);
    if (stored) setDid(stored.did);
  }, []);

  return (
    <IdentityContext.Provider value={{ did, secretKey, unlocked, hasStoredIdentity, unlock, lock, refreshHasStoredIdentity }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}
