export const singleEvent = {
  id: "hema-raj-25-anniversary",
  couple: "Hema and Raj",
  title: "25th Wedding Anniversary",
  subtitle: "25 years of love, laughter and togetherness",
  date: "2026-05-24",
  time: "18:30",
  timeLabel: "Evening 6:30 PM",
  venueName: "Our Home",
  venueAddress: "27921 Hunt Trace Ln, Fulshear, TX 77441",
  venueMapUrl: "https://www.google.com/maps/search/?api=1&query=27921%20Hunt%20Trace%20Ln%2C%20Fulshear%2C%20TX%2077441",
  dressCode: "Saree for ladies. Formal or semi-formal for men.",
  giftNote: "Your presence is the greatest gift of all. No presents please.",
  image: "/images/indian-wedding-theme.jpeg"
};

export const publicSiteUrl = "https://hemaraj25.web.app";
export const flyerUrl = `${publicSiteUrl}${singleEvent.image}`;
export const shortFlyerUrl = `${publicSiteUrl}/flyer`;
export const shortMapUrl = `${publicSiteUrl}/map`;
export const shortCalendarUrl = `${publicSiteUrl}/calendar`;
export const adminEmails = ["rbalakr@gmail.com", "hema.selvaraj@gmail.com"];

export function getCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Hema and Raj 25th Wedding Anniversary",
    dates: "20260524T183000/20260524T213000",
    ctz: "America/Chicago",
    location: `${singleEvent.venueName}, ${singleEvent.venueAddress}`,
    details: `${singleEvent.subtitle}. ${singleEvent.giftNote}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getWhatsAppRsvpUrl(values: {
  phone: string;
  guestName: string;
  status: "yes" | "no";
  adultCount: number;
  childrenCount: number;
  vegetarianCount: number;
  nonVegetarianCount: number;
}) {
  const phone = normalizeWhatsAppPhone(values.phone);
  const response = values.status === "yes" ? "Yes, attending" : "No, unable to attend";
  const message = [
    `*${singleEvent.couple} - ${singleEvent.title}*`,
    "",
    `RSVP for ${values.guestName}: ${response}`,
    `Guests: ${values.adultCount} adult(s), ${values.childrenCount} child(ren)`,
    `Meals: ${values.vegetarianCount} vegetarian, ${values.nonVegetarianCount} non-vegetarian`,
    "",
    "Date: May 24th, 2026",
    `Time: ${singleEvent.timeLabel}`,
    `Venue: ${singleEvent.venueName}`,
    singleEvent.venueAddress,
    "",
    `Flyer: ${shortFlyerUrl}`,
    `Map: ${shortMapUrl}`,
    `Calendar: ${shortCalendarUrl}`,
    "",
    singleEvent.giftNote
  ].join("\n");

  const phonePath = phone ? `/${phone}` : "";
  return `https://wa.me${phonePath}?text=${encodeURIComponent(message)}`;
}

function normalizeWhatsAppPhone(phone: string) {
  const trimmed = phone.trim();
  const withoutInternationalPrefix = trimmed.startsWith("00") ? trimmed.slice(2) : trimmed;
  const digits = withoutInternationalPrefix.replace(/\D/g, "");

  if (digits.length < 10) {
    return "";
  }

  if (digits.length === 10) {
    return `1${digits}`;
  }

  return digits;
}
