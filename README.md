# Hema and Raj RSVP Site

Single-event invitation site for Hema and Raj's 25th wedding anniversary.

Guests open the invite, sign in with Google, and submit their RSVP choice, name, email, phone
number, adult count, children count, vegetarian meal count, non-vegetarian meal count, and comments.
Submissions are saved to Cloud Firestore, one record per signed-in guest.

## Firebase Setup

1. Create a Firebase project.
2. Add a Web app in Firebase Project settings.
3. Enable Authentication with the Google provider.
4. Create a Cloud Firestore database.
5. Copy `.env.example` to `.env.local` and fill in the Firebase web app values.
6. Select your Firebase project locally:

```bash
npx firebase login
npx firebase use --add
```

Build and deploy the static site:

```bash
npm run build
npm run deploy
```

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Data Model

- `rsvps/hema-raj-25-anniversary_{googleUid}` stores guest RSVP submissions.
- `publicAttendees/{googleUid}` stores opted-in public attendee list entries.
- `mail/{autoId}` queues RSVP confirmation emails for the Firebase Trigger Email extension.

Firestore rules in `firestore.rules` require Google Auth for RSVP writes. Guests can read and
update only their own saved RSVP, which lets the app show their previous Yes/No selection when they
return.

## RSVP Email

The app writes confirmation email documents to the Firestore `mail` collection after each RSVP save.
To actually send those emails, install Firebase's Trigger Email extension and configure it to watch
the `mail` collection:

```bash
npx firebase ext:install firebase/firestore-send-email --project hemaraj25
```

Use your preferred SMTP provider in the extension setup. The email includes the flyer, RSVP summary,
Google Maps link, and Google Calendar link.
