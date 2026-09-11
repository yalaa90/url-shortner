import { Pipe, PipeTransform } from '@angular/core';

const FORMAT_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: 'short' },
  medium: { dateStyle: 'medium', timeStyle: 'short' },
  long: { dateStyle: 'long', timeStyle: 'long' },
};

@Pipe({ name: 'dateFormat', standalone: true })
export class DateFormatPipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    format: 'short' | 'medium' | 'long' | 'relative' = 'medium'
  ): string {
    if (!value) {
      return '-';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (format === 'relative') {
      return this.relative(date);
    }

    const locales = navigator.language || 'en-US';
    return new Intl.DateTimeFormat(locales, FORMAT_OPTIONS[format]).format(date);
  }

  private relative(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return 'just now';
    }
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    if (days < 30) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    return date.toLocaleDateString();
  }
}
