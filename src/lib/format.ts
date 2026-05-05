export function formatEventDate(date: string, time: string) {
  if (!date) {
    return "Date pending";
  }

  const value = new Date(`${date}T${time || "12:00"}`);
  if (Number.isNaN(value.getTime())) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}

export function shortDate(date: string) {
  const value = new Date(`${date}T12:00`);
  if (Number.isNaN(value.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(value);
}
