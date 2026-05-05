"use client";

import { GoogleLogo } from "@phosphor-icons/react";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/firebase";

export function GoogleButton({
  label,
  onSuccess
}: {
  label: string;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack small-stack">
      <button className="primary-button" type="button" onClick={handleSignIn} disabled={busy}>
        <GoogleLogo size={20} weight="bold" />
        <span>{busy ? "Opening Google" : label}</span>
      </button>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
