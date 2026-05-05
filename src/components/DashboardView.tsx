"use client";

import {
  ArrowRight,
  CalendarBlank,
  Copy,
  Eye,
  PencilSimple,
  PlusCircle
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppChrome } from "./AppChrome";
import { ConfigNotice } from "./ConfigNotice";
import { GoogleButton } from "./GoogleButton";
import { subscribeToHostEvents } from "@/lib/firebase";
import { formatEventDate, shortDate } from "@/lib/format";
import type { EventRecord } from "@/lib/types";
import { useAuthUser } from "@/lib/useAuthUser";

export function DashboardView() {
  const { user, loading, error: authError } = useAuthUser();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    return subscribeToHostEvents(user, setEvents, setError);
  }, [user]);

  async function copyInvite(eventId: string) {
    const url = `${window.location.origin}/invite/${eventId}`;
    await window.navigator.clipboard.writeText(url);
    setCopied(eventId);
    window.setTimeout(() => setCopied(""), 1800);
  }

  return (
    <AppChrome>
      <section className="dashboard-head">
        <div>
          <p className="eyebrow">Host dashboard</p>
          <h1>Your events</h1>
          <p className="lede">Create, edit, publish, delete, and review RSVP details.</p>
        </div>
        <Link className="primary-button" href="/events/new">
          <PlusCircle size={20} weight="bold" />
          <span>New event</span>
        </Link>
      </section>

      {authError ? <ConfigNotice message={authError} /> : null}

      {loading ? (
        <section className="event-list">
          <div className="skeleton row-skeleton" />
          <div className="skeleton row-skeleton" />
        </section>
      ) : !user ? (
        <section className="empty-state">
          <CalendarBlank size={42} weight="duotone" />
          <h2>Sign in to manage events</h2>
          <GoogleButton label="Sign in with Google" />
        </section>
      ) : error ? (
        <section className="empty-state error-state">
          <h2>Could not load events</h2>
          <p>{error}</p>
        </section>
      ) : events.length === 0 ? (
        <section className="empty-state">
          <CalendarBlank size={42} weight="duotone" />
          <h2>No events yet</h2>
          <p>Create the first invite and publish it when the details are ready.</p>
          <Link className="primary-button" href="/events/new">
            <PlusCircle size={20} weight="bold" />
            <span>Create event</span>
          </Link>
        </section>
      ) : (
        <section className="event-list">
          {events.map((event) => (
            <article className="event-row" key={event.id}>
              <div className="date-tile">
                <span>{shortDate(event.date)}</span>
              </div>
              <div className="event-row-main">
                <div className="row-title-line">
                  <h2>{event.title}</h2>
                  <span className={`status-pill ${event.status}`}>{event.status}</span>
                </div>
                <p>{formatEventDate(event.date, event.time)} at {event.location}</p>
              </div>
              <div className="row-actions">
                <Link className="icon-link" href={`/events/${event.id}`}>
                  <Eye size={19} />
                  <span>Details</span>
                </Link>
                <Link className="icon-link" href={`/events/${event.id}/edit`}>
                  <PencilSimple size={19} />
                  <span>Edit</span>
                </Link>
                <button className="icon-link button-reset" onClick={() => copyInvite(event.id)}>
                  <Copy size={19} />
                  <span>{copied === event.id ? "Copied" : "Invite"}</span>
                </button>
                <Link className="icon-button" href={`/events/${event.id}`} aria-label="Open event">
                  <ArrowRight size={19} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppChrome>
  );
}
