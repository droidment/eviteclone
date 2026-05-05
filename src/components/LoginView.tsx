"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppChrome } from "./AppChrome";
import { ConfigNotice } from "./ConfigNotice";
import { GoogleButton } from "./GoogleButton";
import { useAuthUser } from "@/lib/useAuthUser";

export function LoginView() {
  const router = useRouter();
  const { user, loading, error } = useAuthUser();

  return (
    <AppChrome>
      <section className="narrow-page">
        <div className="auth-panel">
          <p className="eyebrow">Host access</p>
          <h1>Sign in with Google</h1>
          <p>
            Your wedding invitations, guest links, and RSVP details are stored in Firebase under
            your Google account.
          </p>
          {error ? <ConfigNotice message={error} /> : null}
          {loading ? (
            <div className="stack">
              <div className="skeleton title-skeleton" />
              <div className="skeleton button-skeleton" />
            </div>
          ) : user ? (
            <div className="stack">
              <p className="success-copy">Signed in as {user.email ?? user.displayName}.</p>
              <Link className="primary-button" href="/dashboard">
                Continue to dashboard
              </Link>
            </div>
          ) : (
            <GoogleButton label="Continue with Google" onSuccess={() => router.push("/dashboard")} />
          )}
        </div>
      </section>
    </AppChrome>
  );
}
