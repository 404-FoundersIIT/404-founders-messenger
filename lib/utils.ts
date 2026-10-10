import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  return format(date, 'h:mm a');
}

export function formatChatTimestamp(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE');
  }
  return format(date, 'dd/MM/yyyy');
}

export function formatLastSeen(dateString: string | Date | undefined): string {
  if (!dateString) return 'Offline';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return 'Offline';

  if (isToday(date)) {
    return `Last seen today at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Last seen yesterday at ${format(date, 'h:mm a')}`;
  }
  return `Last seen ${format(date, 'MMM d, yyyy')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getInitials(fullName: string = ''): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#00a884', '#128c7e', '#075e54', '#25d366', '#0284c7',
  '#2563eb', '#7c3aed', '#c026d3', '#db2777', '#dc2626',
  '#ea580c', '#d97706', '#65a30d', '#059669', '#0d9488'
];

export function getAvatarColor(identifier: string = ''): string {
  if (!identifier) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
