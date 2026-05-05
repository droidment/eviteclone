"use client";

import { FloppyDisk, Trash, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppChrome } from "./AppChrome";
import { ConfigNotice } from "./ConfigNotice";
import { GoogleButton } from "./GoogleButton";
import {
  createEvent,
  deleteEvent,
  subscribeToEvent,
  updateEvent
} from "@/lib/firebase";
import type { EventInput, EventRecord } from "@/lib/types";
import { useAuthUser } from "@/lib/useAuthUser";

const blankInput: EventInput = {
  title: "",
  description: "",
  location: "",
  date: "",
  time: "",
  coverImage: "/images/indian-wedding-theme.jpeg",
  status: "draft"
};

export function EventFormView({
  mode,
  eventId
}: {
  mode: "new" | "edit";
  eventId?: string;
}) {
  const router = useRouter();
  const { user, loading, error: authError } = useAuthUser();
  const [input, setInput] = useState<EventInput>(blankInput);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !eventId || !user) {
      return;
    }

    return subscribeToEvent(
      eventId,
      (record) => {
        setEvent(record);
        if (record) {
          setInput({
            title: record.title,
            description: record.description,
            location: record.location,
            date: record.date,
            time: record.time,
            coverImage: record.coverImage,
            status: record.status
          });
        }
      },
      setError
    );
  }, [eventId, mode, user]);

  const pageTitle = useMemo(() => (mode === "new" ? "Create event" : "Edit event"), [mode]);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!user) {
      setError("Sign in before saving an event.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (mode === "new") {
        const created = await createEvent(user, input);
        router.push(`/events/${created.id}`);
      } else if (eventId) {
        await updateEvent(eventId, input);
        router.push(`/events/${eventId}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save event.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!eventId || !window.confirm("Delete this event and its invite page?")) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await deleteEvent(eventId);
      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not delete event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppChrome>
      <section className="form-layout">
        <div className="form-intro">
          <p className="eyebrow">Host tools</p>
          <h1>{pageTitle}</h1>
          <p className="lede">
            Save as draft while planning, then publish when the Indian wedding invite is ready for
            guests.
          </p>
          {mode === "edit" && event ? (
            <Link className="secondary-button" href={`/events/${event.id}`}>
              Back to details
            </Link>
          ) : null}
        </div>

        <div className="form-panel">
          {authError ? <ConfigNotice message={authError} /> : null}
          {loading ? (
            <div className="stack">
              <div className="skeleton input-skeleton" />
              <div className="skeleton input-skeleton" />
              <div className="skeleton button-skeleton" />
            </div>
          ) : !user ? (
            <div className="stack">
              <h2>Sign in to continue</h2>
              <GoogleButton label="Sign in with Google" />
            </div>
          ) : mode === "edit" && !event && !error ? (
            <div className="stack">
              <div className="skeleton input-skeleton" />
              <div className="skeleton input-skeleton" />
            </div>
          ) : (
            <form className="event-form" onSubmit={handleSubmit}>
              <label>
                <span>Event title</span>
                <input
                  required
                  value={input.title}
                  onChange={(item) => setInput({ ...input, title: item.target.value })}
                  placeholder="Hema and Raj Wedding Anniversary"
                />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  required
                  value={input.description}
                  onChange={(item) => setInput({ ...input, description: item.target.value })}
                  placeholder="A beautiful journey continues with family, blessings, and dinner."
                />
              </label>
              <div className="form-grid">
                <label>
                  <span>Date</span>
                  <input
                    required
                    type="date"
                    value={input.date}
                    onChange={(item) => setInput({ ...input, date: item.target.value })}
                  />
                </label>
                <label>
                  <span>Time</span>
                  <input
                    required
                    type="time"
                    value={input.time}
                    onChange={(item) => setInput({ ...input, time: item.target.value })}
                  />
                </label>
              </div>
              <label>
                <span>Location</span>
                <input
                  required
                  value={input.location}
                  onChange={(item) => setInput({ ...input, location: item.target.value })}
                  placeholder="Banquet Hall, Naperville"
                />
              </label>
              <label>
                <span>Cover image URL</span>
                <input
                  required
                  value={input.coverImage}
                  onChange={(item) => setInput({ ...input, coverImage: item.target.value })}
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={input.status}
                  onChange={(item) =>
                    setInput({ ...input, status: item.target.value as EventInput["status"] })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>

              {error ? (
                <p className="field-error">
                  <WarningCircle size={18} weight="duotone" />
                  {error}
                </p>
              ) : null}

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={busy}>
                  <FloppyDisk size={20} weight="bold" />
                  <span>{busy ? "Saving" : "Save event"}</span>
                </button>
                {mode === "edit" ? (
                  <button className="danger-button" type="button" onClick={handleDelete} disabled={busy}>
                    <Trash size={20} />
                    <span>Delete</span>
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </div>
      </section>
    </AppChrome>
  );
}
