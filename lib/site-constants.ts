export const SITE_BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://www.freefocusgames.com"
).replace(/\/+$/, "");

export const CONTENT_LAST_UPDATED_ISO = "2026-03-08T00:00:00.000Z";
export const CONTENT_LAST_UPDATED_DATE = new Date(CONTENT_LAST_UPDATED_ISO);
export const CONTENT_LAST_UPDATED_EN = "March 8, 2026";
