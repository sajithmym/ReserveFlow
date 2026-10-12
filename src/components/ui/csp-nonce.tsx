"use client";
import { useInsertionEffect, useRef } from "react";
import { setNonce } from "get-nonce";

export function CspNonce({ nonce }: { nonce: string }) {
  // A client-side navigation keeps the original document's CSP, so retain
  // its initial nonce even if a later RSC response carries a new one.
  const documentNonce = useRef(nonce);
  useInsertionEffect(() => {
    setNonce(documentNonce.current);
  }, []);
  return null;
}
