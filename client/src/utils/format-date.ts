// client/src/utils/format-date.ts

/**
 * Formats a UTC timestamp string to a specified local timezone string.
 *
 * @param utcTimestampString The timestamp string from the database (e.g., "2025-07-15 07:16:22").
 * @param targetTimeZone The IANA timezone name (e.g., 'America/Halifax', 'America/New_York').
 * @param locale The locale string (e.g., 'en-CA', 'en-US').
 * @param options Intl.DateTimeFormatOptions for formatting.
 * @returns The formatted local timestamp string.
 */
export function formatUtcToLocalTime(
  utcTimestampString: string,
  targetTimeZone: string,
  locale: string = 'en-CA', // Default to Canadian English locale
  options?: Intl.DateTimeFormatOptions
): string {
  // Ensure the string is treated as UTC by appending 'Z' if not already present
  const parseableUtcString = utcTimestampString.endsWith('Z') ? utcTimestampString : utcTimestampString + 'Z';

  // Create a Date object from the UTC string
  const date = new Date(parseableUtcString);

  // Define default formatting options if not provided
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24-hour format
    timeZoneName: 'short', // e.g., "ADT"
    timeZone: targetTimeZone,
  };

  // Merge default options with any provided custom options
  const formatOptions = { ...defaultOptions, ...options };

  // Format the date to the target local time
  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

// You can also export common presets if you often use the same options
export const commonDateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZoneName: 'short',
};

// Specific formatter for Halifax
export function formatToADT(utcTimestampString: string, options?: Intl.DateTimeFormatOptions): string {
  const adtTimeZone = 'America/Halifax';
  return formatUtcToLocalTime(utcTimestampString, adtTimeZone, 'en-CA', { ...commonDateTimeFormatOptions, ...options });
}