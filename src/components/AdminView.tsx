"use client";

import { ArrowLeft, CheckCircle, Eye, ForkKnife, UsersThree, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ConfigNotice } from "./ConfigNotice";
import { GoogleButton } from "./GoogleButton";
import { isFirebaseConfigured, subscribeToAdminStats } from "@/lib/firebase";
import { adminEmails, singleEvent } from "@/lib/singleEvent";
import type { PageViewRecord, RsvpRecord } from "@/lib/types";
import { useAuthUser } from "@/lib/useAuthUser";

export function AdminView() {
  const { user, loading, error: authError } = useAuthUser();
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [pageViews, setPageViews] = useState<PageViewRecord[]>([]);
  const [error, setError] = useState("");
  const isAdmin = Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));

  useEffect(() => {
    if (!user || !isFirebaseConfigured || !isAdmin) {
      setRsvps([]);
      setPageViews([]);
      return;
    }

    return subscribeToAdminStats((data) => {
      setRsvps(data.rsvps);
      setPageViews(data.pageViews);
    }, setError);
  }, [user, isAdmin]);

  const stats = useMemo(() => {
    const yesRsvps = rsvps.filter((rsvp) => rsvp.status === "yes");
    const noRsvps = rsvps.filter((rsvp) => rsvp.status === "no");
    const yesTotals = yesRsvps.reduce(
      (total, rsvp) => {
        const adultCount = rsvp.adultCount ?? rsvp.attendeeCount ?? 0;
        const childrenCount = rsvp.childrenCount ?? 0;

        return {
          adults: total.adults + adultCount,
          children: total.children + childrenCount,
          vegetarian: total.vegetarian + (rsvp.vegetarianCount ?? 0),
          nonVegetarian: total.nonVegetarian + (rsvp.nonVegetarianCount ?? 0)
        };
      },
      { adults: 0, children: 0, vegetarian: 0, nonVegetarian: 0 }
    );

    return {
      uniqueOpens: pageViews.length,
      totalOpens: pageViews.reduce((total, view) => total + (view.openCount || 1), 0),
      responded: rsvps.length,
      yes: yesRsvps.length,
      no: noRsvps.length,
      totalGuests: yesTotals.adults + yesTotals.children,
      adults: yesTotals.adults,
      children: yesTotals.children,
      vegetarian: yesTotals.vegetarian,
      nonVegetarian: yesTotals.nonVegetarian
    };
  }, [rsvps, pageViews]);

  return (
    <main className="single-invite-shell admin-shell">
      <section className="admin-panel">
        <div className="admin-toolbar">
          <Link className="secondary-button" href="/">
            <ArrowLeft size={18} />
            <span>Back to RSVP</span>
          </Link>
        </div>

        <div className="admin-head">
          <p className="eyebrow">Admin view</p>
          <h1>{singleEvent.couple}</h1>
          <p className="anniversary-title">{singleEvent.title}</p>
        </div>

        {!isFirebaseConfigured ? (
          <ConfigNotice message="Add Firebase values to .env.local before loading the admin view." />
        ) : null}
        {authError ? <ConfigNotice message={authError} /> : null}
        {error ? <p className="field-error">{error}</p> : null}

        {loading ? (
          <div className="admin-stats-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="skeleton admin-stat-skeleton" key={index} />
            ))}
          </div>
        ) : !user ? (
          <div className="empty-state compact-empty">
            <UsersThree size={36} weight="duotone" />
            <h2>Sign in to view RSVP totals</h2>
            <p>Only Hema and Raj can open this admin view.</p>
            <GoogleButton label="Sign in with Google" />
          </div>
        ) : !isAdmin ? (
          <div className="empty-state compact-empty">
            <XCircle size={36} weight="duotone" />
            <h2>Admin access only</h2>
            <p>This page is only available to approved host accounts.</p>
          </div>
        ) : (
          <>
            <div className="admin-stats-grid">
              <AdminStat icon={<Eye size={24} weight="duotone" />} label="Unique opens" value={stats.uniqueOpens} note={`${stats.totalOpens} total opens`} />
              <AdminStat icon={<UsersThree size={24} weight="duotone" />} label="Responded" value={stats.responded} note="Saved RSVPs" />
              <AdminStat icon={<CheckCircle size={24} weight="duotone" />} label="Yes" value={stats.yes} note={`${stats.totalGuests} guests attending`} />
              <AdminStat icon={<XCircle size={24} weight="duotone" />} label="No" value={stats.no} note="Unable to attend" />
              <AdminStat icon={<UsersThree size={24} weight="duotone" />} label="Guest count" value={stats.totalGuests} note={`${stats.adults} adults, ${stats.children} children`} />
              <AdminStat icon={<ForkKnife size={24} weight="duotone" />} label="Lunch count" value={stats.vegetarian + stats.nonVegetarian} note={`${stats.vegetarian} veg, ${stats.nonVegetarian} non-veg`} />
            </div>

            <section className="admin-section">
              <div className="section-head">
                <div>
                  <h2>Guest Responses</h2>
                  <p>Latest RSVP details, contact info, counts, and comments.</p>
                </div>
              </div>

              {rsvps.length === 0 ? (
                <div className="empty-state compact-empty">
                  <UsersThree size={36} weight="duotone" />
                  <h2>No RSVPs yet</h2>
                  <p>Responses will appear here as guests save their RSVP.</p>
                </div>
              ) : (
                <div className="admin-rsvp-list">
                  {rsvps.map((rsvp) => (
                    <article className="admin-rsvp-row" key={rsvp.id}>
                      <div>
                        <div className="admin-rsvp-title">
                          <h3>{rsvp.guestName}</h3>
                          <span className={`admin-status ${rsvp.status}`}>{rsvp.status}</span>
                        </div>
                        <p>{rsvp.email || "No email"} · {rsvp.phone || "No phone"}</p>
                        {rsvp.message ? <p className="admin-comment">{rsvp.message}</p> : null}
                      </div>
                      <dl>
                        <div>
                          <dt>Guests</dt>
                          <dd>{rsvp.adultCount ?? rsvp.attendeeCount} adult, {rsvp.childrenCount ?? 0} child</dd>
                        </div>
                        <div>
                          <dt>Lunch</dt>
                          <dd>{rsvp.vegetarianCount ?? 0} veg, {rsvp.nonVegetarianCount ?? 0} non-veg</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function AdminStat({
  icon,
  label,
  value,
  note
}: {
  icon: ReactNode;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className="admin-stat">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}
