/**
 * Date Filter Utility
 * Provides consistent date range handling for filtering across the application
 */

/**
 * Parses a date string and returns a Date object set to the start of the day
 * @param dateString - Date string in format YYYY-MM-DD
 * @returns Date object at 00:00:00.000 in local timezone
 */
export function parseStartDate(dateString: string): Date {
  // Parse as local time to avoid timezone conversion issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date;
}

/**
 * Parses a date string and returns a Date object set to the end of the day
 * This ensures the entire day is included in date range filters
 * @param dateString - Date string in format YYYY-MM-DD
 * @returns Date object at 23:59:59.999 in local timezone
 */
export function parseEndDate(dateString: string): Date {
  // Parse as local time to avoid timezone conversion issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return date;
}

/**
 * Creates a date filter object for Prisma queries
 * Handles both startDate and endDate with proper inclusivity
 * @param startDate - Optional start date string (YYYY-MM-DD)
 * @param endDate - Optional end date string (YYYY-MM-DD)
 * @returns Prisma date filter object with gte/lte operators, or undefined if no dates provided
 */
export function createDateFilter(startDate?: string, endDate?: string): { gte?: Date; lte?: Date } | undefined {
  if (!startDate && !endDate) {
    return undefined;
  }

  const filter: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    filter.gte = parseStartDate(startDate);
  }

  if (endDate) {
    filter.lte = parseEndDate(endDate);
  }

  return filter;
}
