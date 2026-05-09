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
