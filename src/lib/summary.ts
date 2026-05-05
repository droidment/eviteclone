import type { RsvpRecord } from "./types";

export function getEventSummary(rsvps: RsvpRecord[]) {
  return rsvps.reduce(
    (summary, rsvp) => {
      summary[rsvp.status] += 1;
      if (rsvp.status === "yes") {
        summary.attendees += rsvp.attendeeCount;
      }
      return summary;
    },
    { yes: 0, no: 0, maybe: 0, attendees: 0 }
  );
}
