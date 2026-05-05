export type RsvpStatus = "yes" | "no";

export type HostUser = {
  id: string;
  name: string;
  email: string;
};

export type GuestIdentity = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  method: "google" | "phone";
};

export type EventRecord = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  coverImage: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type RsvpRecord = {
  id: string;
  eventId: string;
  guestId: string;
  guestName: string;
  email?: string;
  phone?: string;
  status: RsvpStatus;
  attendeeCount: number;
  adultCount?: number;
  childrenCount?: number;
  mealPreference?: "vegetarian" | "non-vegetarian" | "";
  vegetarianCount?: number;
  nonVegetarianCount?: number;
  shareAttendance?: boolean;
  message: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicAttendee = {
  id: string;
  eventId: string;
  guestId: string;
  guestName: string;
  attendeeCount: number;
  adultCount: number;
  childrenCount: number;
  updatedAt: string;
};

export type PageViewRecord = {
  id: string;
  eventId: string;
  visitorId: string;
  openCount: number;
  firstOpenedAt: string;
  lastOpenedAt: string;
};

export type EviteState = {
  host: HostUser | null;
  guest: GuestIdentity | null;
  events: EventRecord[];
  rsvps: RsvpRecord[];
};

export type EventInput = Pick<
  EventRecord,
  "title" | "description" | "location" | "date" | "time" | "coverImage" | "status"
>;
