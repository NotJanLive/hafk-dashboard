import { formatRelative } from "@/lib/utils";

function format(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("de-DE", options).format(date);
}

export function formatDiscordTimestamp(seconds: number, style = "f", now: number = Date.now()) {
  const date = new Date(seconds * 1000);
  const time = format(date, { hour: "2-digit", minute: "2-digit" });
  switch (style) {
    case "t":
      return time;
    case "T":
      return format(date, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    case "d":
      return format(date, { day: "2-digit", month: "2-digit", year: "numeric" });
    case "D":
      return format(date, { day: "numeric", month: "long", year: "numeric" });
    case "F":
      return `${format(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} ${time}`;
    case "R":
      return formatRelative(date.toISOString(), now);
    default:
      return `${format(date, { day: "numeric", month: "long", year: "numeric" })} ${time}`;
  }
}
