"use client";

import { CalendarCheck, House, PlusCircle, SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { signOutOfFirebase } from "@/lib/firebase";
import { useAuthUser } from "@/lib/useAuthUser";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const { user } = useAuthUser();

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Vivah Invite home">
          <CalendarCheck size={28} weight="duotone" />
          <span>Vivah Invite</span>
        </Link>
        <nav className="nav-actions" aria-label="Primary">
          <Link href="/" className="icon-link">
            <House size={20} />
            <span>Home</span>
          </Link>
          <Link href="/dashboard" className="icon-link">
            <CalendarCheck size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/events/new" className="primary-link">
            <PlusCircle size={20} weight="bold" />
            <span>New event</span>
          </Link>
          {user ? (
            <button className="icon-button" onClick={() => signOutOfFirebase()} aria-label="Sign out">
              <SignOut size={20} />
            </button>
          ) : null}
        </nav>
      </header>
      {children}
    </main>
  );
}
