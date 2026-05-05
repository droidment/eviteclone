# AGENTS.md

## Project Goal

Build an MVP Evite-style event invitation app.

Hosts can create events and share invite links. Guests can RSVP using Google login or phone number OTP.

## Product Requirements

### Host Features

- Host signs in with Google.
- Host can create, edit, publish, and delete their own events.
- Host dashboard shows all events owned by the signed-in host.
- Host can view RSVP summary and guest RSVP details.

### Guest Features

- Guest can open a public invite page.
- Guest can RSVP as:
  - Yes
  - No
  - Maybe
- Guest can authenticate using:
  - Google login
  - Phone number OTP
- Guest can submit:
  - name
  - phone or email
  - attendee count
  - optional message

## Suggested Routes

```text
/
 /login
 /dashboard
 /events/new
 /events/[eventId]
 /events/[eventId]/edit
 /invite/[eventId]