"use client";

import {
  CalendarBlank,
  CheckCircle,
  Clock,
  Dress,
  MapPin,
  PaperPlaneTilt,
  SignOut,
  WarningCircle,
  WhatsappLogo
} from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ConfigNotice } from "./ConfigNotice";
import { GoogleButton } from "./GoogleButton";
import {
  isFirebaseConfigured,
  signOutOfFirebase,
  submitPublicSingleEventRsvp,
  subscribeToSingleEventRsvp
} from "@/lib/firebase";
import { getWhatsAppRsvpUrl, singleEvent } from "@/lib/singleEvent";
import type { RsvpRecord, RsvpStatus } from "@/lib/types";
import { useAuthUser } from "@/lib/useAuthUser";

export function HomeView() {
  const { user, loading, error: authError } = useAuthUser();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [existingRsvp, setExistingRsvp] = useState<RsvpRecord | null>(null);
  const [values, setValues] = useState({
    guestName: "",
    phone: "",
    status: "" as RsvpStatus | "",
    adultCount: 1,
    childrenCount: 0,
    vegetarianCount: 0,
    nonVegetarianCount: 0,
    shareAttendance: false,
    message: ""
  });

  function updateCount(
    field: "adultCount" | "childrenCount" | "vegetarianCount" | "nonVegetarianCount",
    delta: number
  ) {
    setValues((current) => {
      const next = Math.min(12, Math.max(0, current[field] + delta));
      const nextValues = {
        ...current,
        [field]: next
      };

      if (field === "vegetarianCount" || field === "nonVegetarianCount") {
        const nextMealTotal =
          (field === "vegetarianCount" ? next : current.vegetarianCount) +
          (field === "nonVegetarianCount" ? next : current.nonVegetarianCount);
        const guestTotal = current.adultCount + current.childrenCount;

        if (nextMealTotal > guestTotal) {
          setAdjustmentNote("Guest count was increased to match the meal count.");
          return {
            ...nextValues,
            adultCount: nextMealTotal,
            childrenCount: 0
          };
        }
      }

      return nextValues;
    });
  }

  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      setExistingRsvp(null);
      return;
    }

    setValues((current) => ({
      ...current,
      guestName: current.guestName || user.displayName || ""
    }));

    return subscribeToSingleEventRsvp(
      user,
      (rsvp) => {
        setExistingRsvp(rsvp);
        if (rsvp) {
          const attendeeCount = rsvp.attendeeCount ?? 1;
          const legacyVegetarianCount =
            rsvp.vegetarianCount ??
            (rsvp.mealPreference === "vegetarian" ? attendeeCount : 0);
          const legacyNonVegetarianCount =
            rsvp.nonVegetarianCount ??
            (rsvp.mealPreference === "non-vegetarian" ? attendeeCount : 0);

          setValues({
            guestName: rsvp.guestName,
            phone: rsvp.phone ?? "",
            status: rsvp.status,
            adultCount: rsvp.adultCount ?? attendeeCount,
            childrenCount: rsvp.childrenCount ?? 0,
            vegetarianCount: legacyVegetarianCount,
            nonVegetarianCount: legacyNonVegetarianCount,
            shareAttendance: rsvp.shareAttendance ?? false,
            message: rsvp.message ?? ""
          });
        }
      },
      setError
    );
  }, [user]);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!user) {
      setError("Please sign in with Google before sending your RSVP.");
      return;
    }
    if (!values.status) {
      setError("Please choose Yes or No.");
      return;
    }
    const selectedStatus = values.status;
    if (values.adultCount + values.childrenCount < 1) {
      setError("Please add at least one adult or child guest.");
      return;
    }
    setBusy(true);
    setSuccess(false);
    setError("");
    setAdjustmentNote("");

    try {
      const mealTotal = values.vegetarianCount + values.nonVegetarianCount;
      const guestTotal = values.adultCount + values.childrenCount;
      const adjustedValues =
        mealTotal > guestTotal
          ? { ...values, adultCount: mealTotal, childrenCount: 0 }
          : values;

      if (mealTotal > guestTotal) {
        setAdjustmentNote("Guest count was increased to match the meal count.");
        setValues(adjustedValues);
      }

      await submitPublicSingleEventRsvp({
        ...adjustedValues,
        status: selectedStatus,
        user
      });
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save RSVP.");
    } finally {
      setBusy(false);
    }
  }

  const whatsAppUrl =
    success && values.status
      ? getWhatsAppRsvpUrl({
          phone: values.phone,
          guestName: values.guestName,
          status: values.status,
          adultCount: values.adultCount,
          childrenCount: values.childrenCount,
          vegetarianCount: values.vegetarianCount,
          nonVegetarianCount: values.nonVegetarianCount
        })
      : "";

  return (
    <main className="single-invite-shell">
      <section className="single-invite-grid">
        <div className="single-flyer-panel">
          <img
            src={singleEvent.image}
            alt="Hema and Raj 25th wedding anniversary invitation"
          />
        </div>

        <aside className="single-rsvp-panel">
          <p className="eyebrow">You are invited</p>
          <h1>{singleEvent.couple}</h1>
          <p className="anniversary-title">{singleEvent.title}</p>
          <p className="lede">{singleEvent.subtitle}. A beautiful journey continues.</p>

          <div className="event-facts">
            <div>
              <CalendarBlank size={22} weight="duotone" />
              <span>May 24th, 2026</span>
            </div>
            <div>
              <Clock size={22} weight="duotone" />
              <span>{singleEvent.timeLabel}</span>
            </div>
            <div>
              <Dress size={22} weight="duotone" />
              <span>{singleEvent.dressCode}</span>
            </div>
            <div>
              <MapPin size={22} weight="duotone" />
              <span>
                <strong className="fact-title">{singleEvent.venueName}</strong>
                {singleEvent.venueAddress}
              </span>
            </div>
          </div>

          <p className="gift-note">{singleEvent.giftNote}</p>

          {!isFirebaseConfigured ? (
            <ConfigNotice message="Add Firebase values to .env.local before guests can submit RSVPs." />
          ) : null}
          {authError ? <ConfigNotice message={authError} /> : null}

          {loading ? (
            <div className="stack single-rsvp-form">
              <div className="skeleton input-skeleton" />
              <div className="skeleton button-skeleton" />
            </div>
          ) : !user ? (
            <div className="stack single-rsvp-form">
              <p className="signin-copy">
                Please sign in with Google so we can save your RSVP and recognize you if you come
                back later.
              </p>
              <GoogleButton label="Sign in with Google" />
            </div>
          ) : (
            <form className="event-form single-rsvp-form" onSubmit={handleSubmit}>
              <div className="signed-in-line">
                <span>Signed in as {user.email}</span>
                <button type="button" className="icon-button" onClick={() => signOutOfFirebase()} aria-label="Sign out">
                  <SignOut size={18} />
                </button>
              </div>

              {existingRsvp ? (
                <div className={`saved-rsvp-banner ${existingRsvp.status}`}>
                  Your current RSVP is {existingRsvp.status.toUpperCase()}.
                </div>
              ) : null}

              <fieldset className="rsvp-options yes-no-options">
                {(["yes", "no"] as RsvpStatus[]).map((status) => (
                  <label key={status} className={`${values.status === status ? "selected" : ""} ${status}`}>
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
                placeholder="Your name"
              />
            </label>

            <label>
              <span>Phone number</span>
              <input
                required
                type="tel"
                value={values.phone}
                onChange={(item) => setValues({ ...values, phone: item.target.value })}
                placeholder="Your phone number"
              />
            </label>

            <div className="count-grid">
              <div className="count-control">
                <span>Adults</span>
                <div className="stepper" role="group" aria-label="Adults count">
                  <button type="button" onClick={() => updateCount("adultCount", -1)} aria-label="Decrease adults">
                    -
                  </button>
                  <strong>{values.adultCount}</strong>
                  <button type="button" onClick={() => updateCount("adultCount", 1)} aria-label="Increase adults">
                    +
                  </button>
                </div>
              </div>
              <div className="count-control">
                <span>Children</span>
                <div className="stepper" role="group" aria-label="Children count">
                  <button type="button" onClick={() => updateCount("childrenCount", -1)} aria-label="Decrease children">
                    -
                  </button>
                  <strong>{values.childrenCount}</strong>
                  <button type="button" onClick={() => updateCount("childrenCount", 1)} aria-label="Increase children">
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="field-group">
              <span className="group-label">Meal Counts</span>
              <div className="meal-count-row">
                <div className="count-control">
                  <span>Vegetarian</span>
                  <div className="stepper compact-stepper" role="group" aria-label="Vegetarian meal count">
                    <button type="button" onClick={() => updateCount("vegetarianCount", -1)} aria-label="Decrease vegetarian meals">
                      -
                    </button>
                    <strong>{values.vegetarianCount}</strong>
                    <button type="button" onClick={() => updateCount("vegetarianCount", 1)} aria-label="Increase vegetarian meals">
                      +
                    </button>
                  </div>
                </div>
                <div className="count-control">
                  <span>Non-Vegetarian</span>
                  <div className="stepper compact-stepper" role="group" aria-label="Non-vegetarian meal count">
                    <button type="button" onClick={() => updateCount("nonVegetarianCount", -1)} aria-label="Decrease non-vegetarian meals">
                      -
                    </button>
                    <strong>{values.nonVegetarianCount}</strong>
                    <button type="button" onClick={() => updateCount("nonVegetarianCount", 1)} aria-label="Increase non-vegetarian meals">
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <label className="visibility-option">
              <input
                type="checkbox"
                checked={values.shareAttendance}
                onChange={(item) =>
                  setValues({ ...values, shareAttendance: item.target.checked })
                }
              />
              <span>Let others know that we are attending</span>
            </label>

            {values.shareAttendance ? (
              <Link className="secondary-button attendee-link" href="/attending">
                View guests attending
              </Link>
            ) : null}

            <label>
              <span>Comments</span>
              <textarea
                value={values.message}
                onChange={(item) => setValues({ ...values, message: item.target.value })}
                placeholder="Any note for Hema and Raj"
              />
            </label>

            {error ? (
              <p className="field-error">
                <WarningCircle size={18} weight="duotone" />
                {error}
              </p>
            ) : null}
            {success ? (
              <div className="success-actions">
                <p className="success-copy">
                  <CheckCircle size={18} weight="duotone" />
                  Thank you. Your RSVP has been saved.
                </p>
                <a
                  className="whatsapp-button"
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  <span>Send details to WhatsApp</span>
                </a>
              </div>
            ) : null}
            {adjustmentNote ? <p className="helper-note">{adjustmentNote}</p> : null}

            <button
              className="primary-button"
              type="submit"
              disabled={busy || !isFirebaseConfigured}
            >
              <PaperPlaneTilt size={20} weight="bold" />
              <span>{busy ? "Saving" : existingRsvp ? "Update RSVP" : "Send RSVP"}</span>
            </button>
            </form>
          )}
        </aside>
      </section>
    </main>
  );
}
