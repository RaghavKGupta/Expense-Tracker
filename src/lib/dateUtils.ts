// Utility functions for consistent date handling without timezone issues

import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore } from 'date-fns';

// Helper function to parse date strings consistently without timezone issues
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Helper function to format dates consistently without timezone issues
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's date as a consistent string
export function getTodayString(): string {
  return formatLocalDate(new Date());
}

// Add time periods to a date and return formatted string
export function addWeeksFormatted(dateString: string, weeks: number): string {
  const date = parseLocalDate(dateString);
  const newDate = addWeeks(date, weeks);
  return formatLocalDate(newDate);
}

export function addMonthsFormatted(dateString: string, months: number): string {
  const date = parseLocalDate(dateString);
  const newDate = addMonths(date, months);
  return formatLocalDate(newDate);
}

export function addYearsFormatted(dateString: string, years: number): string {
  const date = parseLocalDate(dateString);
  const newDate = addYears(date, years);
  return formatLocalDate(newDate);
}

// Compare dates safely
export function isAfterLocal(dateString1: string, dateString2: string): boolean {
  return isAfter(parseLocalDate(dateString1), parseLocalDate(dateString2));
}

export function isBeforeLocal(dateString1: string, dateString2: string): boolean {
  return isBefore(parseLocalDate(dateString1), parseLocalDate(dateString2));
}