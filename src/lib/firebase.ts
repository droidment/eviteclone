import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type User
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
  type Unsubscribe
} from "firebase/firestore";
import { flyerUrl, getCalendarUrl, singleEvent } from "./singleEvent";
import type { EventInput, EventRecord, PublicAttendee, RsvpRecord } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebase() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase environment variables are not configured.");
  }

  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = auth ?? getAuth(app);
  db = db ?? getFirestore(app);

  return { app, auth, db };
}

export async function signInWithGoogle() {
  const { auth } = getFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutOfFirebase() {
  const { auth } = getFirebase();
  await signOut(auth);
}

export function subscribeToHostEvents(
  user: User,
  onNext: (events: EventRecord[]) => void,
  onError: (message: string) => void
): Unsubscribe {
  const { db } = getFirebase();
  const eventsQuery = query(collection(db, "events"), where("ownerId", "==", user.uid));

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as EventRecord)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onNext(events);
    },
    (error) => onError(error.message)
  );
}

export function subscribeToEvent(
  eventId: string,
  onNext: (event: EventRecord | null) => void,
  onError: (message: string) => void
): Unsubscribe {
  const { db } = getFirebase();
  return onSnapshot(
    doc(db, "events", eventId),
    (snapshot) => {
      onNext(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as EventRecord) : null);
    },
    (error) => onError(error.message)
  );
}

export function subscribeToEventRsvps(
  eventId: string,
  onNext: (rsvps: RsvpRecord[]) => void,
  onError: (message: string) => void
): Unsubscribe {
  const { db } = getFirebase();
  const rsvpQuery = query(
    collection(db, "rsvps"),
    where("eventId", "==", eventId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    rsvpQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as RsvpRecord));
    },
    (error) => onError(error.message)
  );
}

export async function createEvent(user: User, input: EventInput) {
  const { db } = getFirebase();
  const now = new Date().toISOString();
  const record = {
    ...input,
    ownerId: user.uid,
    ownerEmail: user.email ?? "",
    createdAt: now,
    updatedAt: now
  };

  const reference = await addDoc(collection(db, "events"), record);
  return { id: reference.id, ...record } as EventRecord;
}

export async function updateEvent(eventId: string, input: EventInput) {
  const { db } = getFirebase();
  await updateDoc(doc(db, "events", eventId), {
    ...input,
    updatedAt: new Date().toISOString()
  });
}

export async function publishEvent(eventId: string) {
  const { db } = getFirebase();
  await updateDoc(doc(db, "events", eventId), {
    status: "published",
    updatedAt: new Date().toISOString()
  });
}

export async function deleteEvent(eventId: string) {
  const { db } = getFirebase();
  const batch = writeBatch(db);
  const rsvpSnapshot = await getDocs(query(collection(db, "rsvps"), where("eventId", "==", eventId)));

  rsvpSnapshot.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
  await deleteDoc(doc(db, "events", eventId));
}

export async function submitRsvp(
  user: User,
  eventId: string,
  values: {
    guestName: string;
    contact: string;
    status: RsvpRecord["status"];
    attendeeCount: number;
    message: string;
  }
) {
  const { db } = getFirebase();
  const now = new Date().toISOString();
  const rsvpId = `${eventId}_${user.uid}`;

  await setDoc(
    doc(db, "rsvps", rsvpId),
    {
      eventId,
      guestId: user.uid,
      guestName: values.guestName,
      email: user.email ?? (values.contact.includes("@") ? values.contact : ""),
      phone: !values.contact.includes("@") ? values.contact : "",
      status: values.status,
      attendeeCount: values.attendeeCount,
      message: values.message,
      updatedAt: now,
      createdAt: now
    },
    { merge: true }
  );
}

export async function submitPublicSingleEventRsvp(values: {
  user: User;
  guestName: string;
  phone: string;
  status: RsvpRecord["status"];
  adultCount: number;
  childrenCount: number;
  vegetarianCount: number;
  nonVegetarianCount: number;
  shareAttendance: boolean;
  message: string;
}) {
  const { db } = getFirebase();
  const now = new Date().toISOString();
  const rsvpId = `${singleEvent.id}_${values.user.uid}`;
  const existing = await getDoc(doc(db, "rsvps", rsvpId));
  const adultCount = Math.max(0, values.adultCount);
  const childrenCount = Math.max(0, values.childrenCount);
  const vegetarianCount = Math.max(0, values.vegetarianCount);
  const nonVegetarianCount = Math.max(0, values.nonVegetarianCount);

  await setDoc(
    doc(db, "rsvps", rsvpId),
    {
      eventId: singleEvent.id,
      guestId: values.user.uid,
      guestName: values.guestName,
      email: values.user.email ?? "",
      phone: values.phone,
      status: values.status,
      attendeeCount: adultCount + childrenCount,
      adultCount,
      childrenCount,
      vegetarianCount,
      nonVegetarianCount,
      shareAttendance: values.shareAttendance,
      mealPreference: deleteField(),
      message: values.message,
      createdAt: existing.exists() ? existing.data().createdAt : now,
      updatedAt: now
    },
    { merge: true }
  );

  if (values.status === "yes" && values.shareAttendance) {
    await setDoc(doc(db, "publicAttendees", values.user.uid), {
      eventId: singleEvent.id,
      guestId: values.user.uid,
      guestName: values.guestName,
      attendeeCount: adultCount + childrenCount,
      adultCount,
      childrenCount,
      updatedAt: now
    });
  } else {
    await deleteDoc(doc(db, "publicAttendees", values.user.uid));
  }

  await addDoc(collection(db, "mail"), {
    to: values.user.email ?? "",
    eventId: singleEvent.id,
    guestId: values.user.uid,
    createdAt: now,
    message: {
      subject: `Your RSVP for ${singleEvent.couple}'s ${singleEvent.title}`,
      text: buildRsvpEmailText({
        guestName: values.guestName,
        status: values.status,
        adultCount,
        childrenCount,
        vegetarianCount,
        nonVegetarianCount
      }),
      html: buildRsvpEmailHtml({
        guestName: values.guestName,
        status: values.status,
        adultCount,
        childrenCount,
        vegetarianCount,
        nonVegetarianCount
      })
    }
  });
}

function buildRsvpEmailText(values: {
  guestName: string;
  status: RsvpRecord["status"];
  adultCount: number;
  childrenCount: number;
  vegetarianCount: number;
  nonVegetarianCount: number;
}) {
  return [
    `Dear ${values.guestName},`,
    "",
    `Thank you for your RSVP for ${singleEvent.couple}'s ${singleEvent.title}.`,
    `Response: ${values.status.toUpperCase()}`,
    `Guests: ${values.adultCount} adult(s), ${values.childrenCount} child(ren)`,
    `Meals: ${values.vegetarianCount} vegetarian, ${values.nonVegetarianCount} non-vegetarian`,
    "",
    `${singleEvent.date} at ${singleEvent.timeLabel}`,
    `${singleEvent.venueName}`,
    `${singleEvent.venueAddress}`,
    "",
    `Google Maps: ${singleEvent.venueMapUrl}`,
    `Add to Google Calendar: ${getCalendarUrl()}`,
    "",
    singleEvent.giftNote
  ].join("\n");
}

function buildRsvpEmailHtml(values: {
  guestName: string;
  status: RsvpRecord["status"];
  adultCount: number;
  childrenCount: number;
  vegetarianCount: number;
  nonVegetarianCount: number;
}) {
  const response = values.status === "yes" ? "Yes, attending" : "No, unable to attend";
  const calendarUrl = getCalendarUrl();

  return `
    <div style="margin:0;background:#fbf3df;padding:24px;font-family:Arial,sans-serif;color:#0d2d1d;">
      <div style="max-width:680px;margin:0 auto;background:#fff8e8;border:1px solid #c99a2c;padding:22px;">
        <h1 style="font-family:Georgia,serif;margin:0 0 6px;color:#0f3a25;">${singleEvent.couple}</h1>
        <h2 style="font-family:Georgia,serif;margin:0 0 16px;color:#b88415;">${singleEvent.title}</h2>
        <p>Dear ${values.guestName},</p>
        <p>Thank you for your RSVP. Here are the details we saved:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #ead8a9;"><strong>Response</strong></td><td style="padding:8px;border-bottom:1px solid #ead8a9;">${response}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #ead8a9;"><strong>Guests</strong></td><td style="padding:8px;border-bottom:1px solid #ead8a9;">${values.adultCount} adult(s), ${values.childrenCount} child(ren)</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #ead8a9;"><strong>Meals</strong></td><td style="padding:8px;border-bottom:1px solid #ead8a9;">${values.vegetarianCount} vegetarian, ${values.nonVegetarianCount} non-vegetarian</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #ead8a9;"><strong>Date</strong></td><td style="padding:8px;border-bottom:1px solid #ead8a9;">May 24th, 2026</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #ead8a9;"><strong>Time</strong></td><td style="padding:8px;border-bottom:1px solid #ead8a9;">${singleEvent.timeLabel}</td></tr>
          <tr><td style="padding:8px;"><strong>Venue</strong></td><td style="padding:8px;">${singleEvent.venueName}<br>${singleEvent.venueAddress}</td></tr>
        </table>
        <p>
          <a href="${singleEvent.venueMapUrl}" style="display:inline-block;background:#0f3a25;color:#fff8e8;padding:10px 14px;text-decoration:none;border-radius:6px;margin-right:8px;">Open Google Maps</a>
          <a href="${calendarUrl}" style="display:inline-block;background:#b88415;color:#fff8e8;padding:10px 14px;text-decoration:none;border-radius:6px;">Add to Google Calendar</a>
        </p>
        <img src="${flyerUrl}" alt="Hema and Raj anniversary invitation" style="display:block;width:100%;max-width:520px;margin:22px auto;border:1px solid #c99a2c;" />
        <p style="font-family:Georgia,serif;color:#0f3a25;">${singleEvent.giftNote}</p>
      </div>
    </div>
  `;
}

export function subscribeToSingleEventRsvp(
  user: User,
  onNext: (rsvp: RsvpRecord | null) => void,
  onError: (message: string) => void
): Unsubscribe {
  const { db } = getFirebase();
  const rsvpId = `${singleEvent.id}_${user.uid}`;

  return onSnapshot(
    doc(db, "rsvps", rsvpId),
    (snapshot) => {
      onNext(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as RsvpRecord) : null);
    },
    (error) => onError(error.message)
  );
}

export function subscribeToPublicAttendees(
  onNext: (attendees: PublicAttendee[]) => void,
  onError: (message: string) => void
): Unsubscribe {
  const { db } = getFirebase();
  const attendeesQuery = query(collection(db, "publicAttendees"), orderBy("guestName", "asc"));

  return onSnapshot(
    attendeesQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PublicAttendee));
    },
    (error) => onError(error.message)
  );
}
