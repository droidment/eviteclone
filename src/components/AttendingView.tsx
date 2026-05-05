"use client";

import { ArrowLeft, MapPin, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfigNotice } from "./ConfigNotice";
import { GoogleButton } from "./GoogleButton";
import {
  isFirebaseConfigured,
  subscribeToPublicAttendees,
  subscribeToSingleEventRsvp
} from "@/lib/firebase";
import type { PublicAttendee, RsvpRecord } from "@/lib/types";
import { singleEvent } from "@/lib/singleEvent";
import { useAuthUser } from "@/lib/useAuthUser";

export function AttendingView() {
  const { user, loading, error: authError } = useAuthUser();
  const [attendees, setAttendees] = useState<PublicAttendee[]>([]);
  const [rsvp, setRsvp] = useState<RsvpRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      setRsvp(null);
      return;
    }

    return subscribeToSingleEventRsvp(user, setRsvp, setError);
  }, [user]);

  useEffect(() => {
    if (!user || !isFirebaseConfigured || !rsvp?.shareAttendance || rsvp.status !== "yes") {
      setAttendees([]);
      return;
    }

    return subscribeToPublicAttendees(setAttendees, setError);
  }, [user, rsvp]);

  const canView = rsvp?.status === "yes" && rsvp.shareAttendance;

  return (
    <main className="single-invite-shell attending-shell">
      <section className="attending-panel">
        <Link className="secondary-button" href="/">
          <ArrowLeft size={18} />
          <span>Back to RSVP</span>
        </Link>

        <div className="attending-head">
          <p className="eyebrow">Guests attending</p>
          <h1>Who has said yes</h1>
          <p className="lede">
            This list only includes guests who RSVP Yes and chose to let others know they are
            attending.
          </p>
          <div className="attending-venue">
            <MapPin size={20} weight="duotone" />
            <span>
              <strong>{singleEvent.venueName}</strong>
              {singleEvent.venueAddress}
            </span>
          </div>
        </div>

        {!isFirebaseConfigured ? (
          <ConfigNotice message="Add Firebase values to .env.local before loading attendee lists." />
        ) : null}
        {authError ? <ConfigNotice message={authError} /> : null}
        {error ? <p className="field-error">{error}</p> : null}

        {loading ? (
          <div className="stack">
            <div className="skeleton row-skeleton" />
            <div className="skeleton row-skeleton" />
          </div>
        ) : !user ? (
          <div className="empty-state compact-empty">
            <UsersThree size={36} weight="duotone" />
            <h2>Sign in to view the list</h2>
            <p>Only signed-in guests can view the attending list.</p>
            <GoogleButton label="Sign in with Google" />
          </div>
        ) : !canView ? (
          <div className="empty-state compact-empty">
            <UsersThree size={36} weight="duotone" />
            <h2>Save your RSVP visibility first</h2>
            <p>Choose Yes, select “Let others know that we are attending”, and save your RSVP.</p>
          </div>
        ) : attendees.length === 0 ? (
          <div className="empty-state compact-empty">
            <UsersThree size={36} weight="duotone" />
            <h2>No visible RSVPs yet</h2>
            <p>Accepted guests will appear here after they opt in.</p>
          </div>
        ) : (
          <div className="attendee-list">
            {attendees.map((attendee) => (
              <article className="attendee-row" key={attendee.id}>
                <div>
                  <h2>{attendee.guestName}</h2>
                  <p>
                    {attendee.adultCount} adult{attendee.adultCount === 1 ? "" : "s"}
                    {attendee.childrenCount > 0
                      ? `, ${attendee.childrenCount} child${attendee.childrenCount === 1 ? "" : "ren"}`
                      : ""}
                  </p>
                </div>
                <strong>{attendee.attendeeCount}</strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
