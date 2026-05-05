"use client";

import {
  ArrowSquareOut,
  CheckCircle,
  Copy,
  PencilSimple,
  RocketLaunch,
  UsersThree,
  XCircle
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppChrome } from "./AppChrome";
import { ConfigNotice } from "./ConfigNotice";
import { GoogleButton } from "./GoogleButton";
import { publishEvent, subscribeToEvent, subscribeToEventRsvps } from "@/lib/firebase";
import { formatEventDate } from "@/lib/format";
import { getEventSummary } from "@/lib/summary";
import type { EventRecord, RsvpRecord } from "@/lib/types";
import { useAuthUser } from "@/lib/useAuthUser";

export function EventDetailView({ eventId }: { eventId: string }) {
  const { user, loading, error: authError } = useAuthUser();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const summary = useMemo(() => getEventSummary(rsvps), [rsvps]);

  useEffect(() => {
    if (!user) {
      setEvent(null);
      setRsvps([]);
      return;
    }

    const unsubscribeEvent = subscribeToEvent(eventId, setEvent, setError);
    const unsubscribeRsvps = subscribeToEventRsvps(eventId, setRsvps, setError);

    return () => {
      unsubscribeEvent();
      unsubscribeRsvps();
    };
  }, [eventId, user]);

  async function copyInvite() {
    await window.navigator.clipboard.writeText(`${window.location.origin}/invite/${eventId}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handlePublish() {
    setBusy(true);
    setError("");
    try {
      await publishEvent(eventId);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not publish event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppChrome>
      {authError ? <ConfigNotice message={authError} /> : null}
      {loading ? (
        <section className="detail-grid">
          <div className="skeleton hero-skeleton" />
          <div className="skeleton panel-skeleton" />
        </section>
      ) : !user ? (
        <section className="empty-state">
          <UsersThree size={42} weight="duotone" />
          <h2>Sign in to view host details</h2>
          <GoogleButton label="Sign in with Google" />
        </section>
      ) : error ? (
        <section className="empty-state error-state">
          <h2>Could not load event</h2>
          <p>{error}</p>
        </section>
      ) : !event ? (
        <section className="empty-state">
          <XCircle size={42} weight="duotone" />
          <h2>Event not found</h2>
          <Link className="secondary-button" href="/dashboard">
            Back to dashboard
          </Link>
        </section>
      ) : (
        <>
          <section className="detail-grid">
            <div className="event-hero">
              <img src={event.coverImage} alt={`${event.title} cover`} />
              <div className="event-hero-copy">
                <span className={`status-pill ${event.status}`}>{event.status}</span>
                <h1>{event.title}</h1>
                <p>{event.description}</p>
                <p className="event-meta">{formatEventDate(event.date, event.time)} at {event.location}</p>
              </div>
            </div>

            <aside className="owner-panel">
              <h2>RSVP summary</h2>
              <div className="summary-grid">
                <div>
                  <span>Yes</span>
                  <strong>{summary.yes}</strong>
                </div>
                <div>
                  <span>Maybe</span>
                  <strong>{summary.maybe}</strong>
                </div>
                <div>
                  <span>No</span>
                  <strong>{summary.no}</strong>
                </div>
                <div>
                  <span>Attendees</span>
                  <strong>{summary.attendees}</strong>
                </div>
              </div>
              <div className="stack">
                {event.status === "draft" ? (
                  <button className="primary-button" onClick={handlePublish} disabled={busy}>
                    <RocketLaunch size={20} weight="bold" />
                    <span>{busy ? "Publishing" : "Publish invite"}</span>
                  </button>
                ) : null}
                <button className="secondary-button" onClick={copyInvite}>
                  <Copy size={20} />
                  <span>{copied ? "Copied" : "Copy invite link"}</span>
                </button>
                <Link className="secondary-button" href={`/invite/${event.id}`}>
                  <ArrowSquareOut size={20} />
                  <span>Open invite</span>
                </Link>
                <Link className="secondary-button" href={`/events/${event.id}/edit`}>
                  <PencilSimple size={20} />
                  <span>Edit event</span>
                </Link>
              </div>
            </aside>
          </section>

          <section className="rsvp-section">
            <div className="section-head">
              <div>
                <p className="eyebrow">Guest details</p>
                <h2>Responses</h2>
              </div>
              <span className="count-pill">{rsvps.length} total</span>
            </div>
            {rsvps.length === 0 ? (
              <div className="empty-state compact-empty">
                <CheckCircle size={34} weight="duotone" />
                <h3>No RSVPs yet</h3>
                <p>Publish the invite and share the link to start collecting responses.</p>
              </div>
            ) : (
              <div className="rsvp-table">
                {rsvps.map((rsvp) => (
                  <article key={rsvp.id} className="rsvp-row">
                    <div>
                      <h3>{rsvp.guestName}</h3>
                      <p>{rsvp.email || rsvp.phone}</p>
                    </div>
                    <span className={`status-pill ${rsvp.status}`}>{rsvp.status}</span>
                    <strong>{rsvp.attendeeCount}</strong>
                    <p>{rsvp.message || "No message"}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppChrome>
  );
}
