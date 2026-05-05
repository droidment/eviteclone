"use client";

import { CheckCircle, GoogleLogo, PaperPlaneTilt, UsersThree, WarningCircle } from "@phosphor-icons/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConfigNotice } from "./ConfigNotice";
import { GoogleButton } from "./GoogleButton";
import { isFirebaseConfigured, submitRsvp, subscribeToEvent } from "@/lib/firebase";
import { formatEventDate } from "@/lib/format";
import type { EventRecord, RsvpStatus } from "@/lib/types";
import { useAuthUser } from "@/lib/useAuthUser";

export function InviteView({ eventId }: { eventId: string }) {
  const { user, loading, error: authError } = useAuthUser();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({
    guestName: "",
    contact: "",
    status: "yes" as RsvpStatus,
    attendeeCount: 1,
    message: ""
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("Add Firebase values to .env.local before loading invite pages.");
      return;
    }

    return subscribeToEvent(eventId, setEvent, setError);
  }, [eventId]);

  useEffect(() => {
    if (user) {
      setValues((current) => ({
        ...current,
        guestName: current.guestName || user.displayName || "",
        contact: current.contact || user.email || ""
      }));
    }
  }, [user]);

  const unavailable = useMemo(() => {
    if (!event) {
      return false;
    }
    return event.status !== "published";
  }, [event]);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!user) {
      setError("Sign in with Google before sending an RSVP.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      await submitRsvp(user, eventId, values);
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not send RSVP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="invite-shell">
      {authError ? <ConfigNotice message={authError} /> : null}
      {!event && !error ? (
        <section className="invite-grid">
          <div className="skeleton invite-image-skeleton" />
          <div className="skeleton panel-skeleton" />
        </section>
      ) : error ? (
        <section className="empty-state error-state">
          <WarningCircle size={42} weight="duotone" />
          <h1>Invite unavailable</h1>
          <p>{error}</p>
        </section>
      ) : !event ? (
        <section className="empty-state">
          <WarningCircle size={42} weight="duotone" />
          <h1>Invite not found</h1>
        </section>
      ) : unavailable ? (
        <section className="empty-state">
          <UsersThree size={42} weight="duotone" />
          <h1>This invite is not published yet</h1>
          <p>Check back after the host shares the final invite link.</p>
        </section>
      ) : (
        <section className="invite-grid">
          <div className="invite-art">
            <img src={event.coverImage} alt={`${event.title} cover`} />
            <div className="invite-copy">
              <p className="eyebrow">You are invited</p>
              <h1>{event.title}</h1>
              <p>{event.description}</p>
              <strong>{formatEventDate(event.date, event.time)}</strong>
              <span>{event.location}</span>
            </div>
          </div>

          <aside className="rsvp-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">RSVP</p>
                <h2>Your response</h2>
              </div>
              {user ? <GoogleLogo size={24} weight="duotone" /> : null}
            </div>

            {loading ? (
              <div className="stack">
                <div className="skeleton input-skeleton" />
                <div className="skeleton button-skeleton" />
              </div>
            ) : !user ? (
              <div className="stack">
                <p>Use Google to confirm your identity before sending a response.</p>
                <GoogleButton label="Continue with Google" />
              </div>
            ) : (
              <form className="event-form" onSubmit={handleSubmit}>
                <fieldset className="rsvp-options">
                  {(["yes", "maybe", "no"] as RsvpStatus[]).map((status) => (
                    <label key={status} className={values.status === status ? "selected" : ""}>
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={values.status === status}
                        onChange={() => setValues({ ...values, status })}
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </fieldset>
                <label>
                  <span>Name</span>
                  <input
                    required
                    value={values.guestName}
                    onChange={(item) => setValues({ ...values, guestName: item.target.value })}
                  />
                </label>
                <label>
                  <span>Phone or email</span>
                  <input
                    required
                    value={values.contact}
                    onChange={(item) => setValues({ ...values, contact: item.target.value })}
                  />
                </label>
                <label>
                  <span>Attendee count</span>
                  <input
                    required
                    min={0}
                    max={12}
                    type="number"
                    value={values.attendeeCount}
                    onChange={(item) =>
                      setValues({ ...values, attendeeCount: Number(item.target.value) })
                    }
                  />
                </label>
                <label>
                  <span>Message</span>
                  <textarea
                    value={values.message}
                    onChange={(item) => setValues({ ...values, message: item.target.value })}
                    placeholder="Optional note for the host"
                  />
                </label>

                {error ? <p className="field-error">{error}</p> : null}
                {success ? (
                  <p className="success-copy">
                    <CheckCircle size={18} weight="duotone" />
                    RSVP saved.
                  </p>
                ) : null}

                <button className="primary-button" type="submit" disabled={busy}>
                  <PaperPlaneTilt size={20} weight="bold" />
                  <span>{busy ? "Sending" : "Send RSVP"}</span>
                </button>
              </form>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}
