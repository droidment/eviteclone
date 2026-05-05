"use client";

import { GoogleLogo } from "@phosphor-icons/react";
import { FirebaseError } from "firebase/app";
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
      if (isCancelledSignIn(error)) {
        return;
      }

      setError(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack small-stack">
      <button className="primary-button google-button" type="button" onClick={handleSignIn} disabled={busy}>
        <GoogleLogo size={20} weight="bold" />
        <span>{busy ? "Opening Google" : label}</span>
      </button>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}

function isCancelledSignIn(error: unknown) {
  if (error instanceof FirebaseError) {
    return error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-closed-by-user";
  }

  return error instanceof Error && /auth\/(cancelled-popup-request|popup-closed-by-user)/.test(error.message);
}
