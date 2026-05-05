"use client";

import { WarningCircle } from "@phosphor-icons/react";

export function ConfigNotice({ message }: { message?: string }) {
  return (
    <div className="notice">
      <WarningCircle size={22} weight="duotone" />
      <div>
        <strong>Firebase setup needed</strong>
        <p>{message ?? "Create .env.local from .env.example and add your Firebase web app values."}</p>
      </div>
    </div>
  );
}
