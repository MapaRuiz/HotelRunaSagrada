import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ServiceSchedule } from '../../../../model/service-schedule';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'DAILY'
] as const;

export type DayValue = typeof DAY_ORDER[number];
type WeekDayValue = Exclude<DayValue, 'DAILY'>;

export const DAY_TEXT: Record<DayValue, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
  DAILY: 'Todos los días'
};

const dayTextFactory = (target: DayValue) => {
  return (value: string): string => {
    const normalized = value?.toUpperCase() ?? '';
    return normalized === target ? DAY_TEXT[target] : getDayLabel(value ?? '');
  };
};

export const getMondayText = dayTextFactory('MONDAY');
export const getTuesdayText = dayTextFactory('TUESDAY');
export const getWednesdayText = dayTextFactory('WEDNESDAY');
export const getThursdayText = dayTextFactory('THURSDAY');
export const getFridayText = dayTextFactory('FRIDAY');
export const getSaturdayText = dayTextFactory('SATURDAY');
export const getSundayText = dayTextFactory('SUNDAY');
export const getDailyText = dayTextFactory('DAILY');

const DAY_OPTIONS: Array<{ label: string; value: DayValue }> = DAY_ORDER.map((day) => ({
  label: DAY_TEXT[day],
  value: day
}));

const isDayValue = (value: string): value is DayValue => {
  return (DAY_ORDER as readonly string[]).includes(value);
};

const WEEK_DAYS: WeekDayValue[] = DAY_ORDER.filter(
  (day): day is WeekDayValue => day !== 'DAILY'
);

export function getDayLabel(day: string): string {
  const upper = day?.toUpperCase() ?? '';
  return DAY_TEXT[upper as DayValue] ?? (day || 'N/A');
}

export function formatDaysLabel(value: unknown): string {
  const normalized = normalizeDayValues(value);
  const display = sortDayValues(applyDailyRulesToDays(normalized));
  if (!display.length) {
    return '';
  }
  return display.map((day) => getDayLabel(day)).join(', ');
}

function normalizeDayValues(value: unknown): DayValue[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((day) => (typeof day === 'string' ? day.trim().toUpperCase() : ''))
      .filter(isDayValue);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((day) => day.trim().toUpperCase())
      .filter(isDayValue);
  }
  return [];
}

function applyDailyRulesToDays(days: DayValue[]): DayValue[] {
  const unique = Array.from(new Set(days));
  const hasDaily = unique.includes('DAILY');
  const weekDaysOnly = unique.filter((day): day is WeekDayValue => day !== 'DAILY');

  if (hasDaily) {
    return ['DAILY'];
  }

  const hasAllWeekDays =
    weekDaysOnly.length === WEEK_DAYS.length &&
    WEEK_DAYS.every((day) => weekDaysOnly.includes(day));

  if (hasAllWeekDays) {
    return ['DAILY'];
  }

  return weekDaysOnly;
}

function sortDayValues(days: DayValue[]): DayValue[] {
  const orderMap = new Map(DAY_ORDER.map((day, index) => [day, index]));
  return Array.from(new Set(days)).sort(
    (a, b) => (orderMap.get(a)! - orderMap.get(b)!)
  );
}

@Component({
  selector: 'app-service-schedule-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './service-schedule-form.html',
  styleUrl: './service-schedule-form.css'
})
export class ServiceScheduleForm implements OnChanges {
  @Input() draft: Partial<ServiceSchedule> = {};
  @Input() loading = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<ServiceSchedule>();

  readonly dayOrder = DAY_ORDER;
  readonly dayOptions = DAY_OPTIONS;
  readonly getDayLabel = getDayLabel;

  selectedDays: DayValue[] = [];
  daysOfWeekString = '';
  startTime = '';
  endTime = '';
  isTimeRangeValid = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['draft']) {
      const raw = normalizeDayValues(this.draft?.days_of_week);
      this.syncSelections(raw);
      this.startTime = this.draft?.start_time ?? '';
      this.endTime = this.draft?.end_time ?? '';
    }
  }

  onToggleDay(day: DayValue, checked: boolean): void {
    const current = new Set(this.selectedDays);

    if (day === 'DAILY') {
      if (checked) {
        current.clear();
        current.add('DAILY');
        this.syncSelections(Array.from(current));
        return;
      }
      current.delete('DAILY');
      this.syncSelections(Array.from(current));
      return;
    }

    if (checked) {
      if (current.has('DAILY')) {
        this.syncSelections(Array.from(current));
        return; // ignore individual selection when DAILY is active
      }
      current.add(day);
    } else {
      current.delete(day);
    }

    this.syncSelections(Array.from(current));
  }

  submit(): void {
    this.syncSelections(this.selectedDays);
    if (!this.isValidScheduleTimes()) {
      this.isTimeRangeValid = false;
      return;
    }
    this.isTimeRangeValid = true;
    const payload: ServiceSchedule = {
      ...(this.draft as ServiceSchedule),
      days_of_week: [...this.selectedDays],
      start_time: this.startTime,
      end_time: this.endTime
    };
    this.save.emit(payload);
  }

  private syncSelections(days: DayValue[]): void {
    const normalized = applyDailyRulesToDays(days);
    const sorted = sortDayValues(normalized);
    this.selectedDays = sorted;
    this.daysOfWeekString = sorted.join(',');
    this.draft = {
      ...this.draft,
      days_of_week: [...sorted]
    };
  }

  private isValidScheduleTimes(): boolean {
    if (!this.isValidTime(this.startTime) || !this.isValidTime(this.endTime)) {
      return false;
    }
    return this.parseTimeToMinutes(this.startTime) < this.parseTimeToMinutes(this.endTime);
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  private parseTimeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
