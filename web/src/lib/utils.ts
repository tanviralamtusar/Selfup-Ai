import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number, formatStr: string = 'PPP') {
  return format(new Date(date), formatStr)
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatRelative(date: Date | string | number) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * YYYY-MM-DD for the browser's local day (optionally `daysAgo` days back).
 * Days follow the user's own time zone, matching the server's `todayIn(profile.timezone)`.
 */
export function localDateStr(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
