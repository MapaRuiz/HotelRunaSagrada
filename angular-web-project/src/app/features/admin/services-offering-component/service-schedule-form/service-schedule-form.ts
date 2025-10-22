import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ServiceSchedule } from '../../../../model/service-schedule';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'DAILY'
] as const;

type DayValue = typeof DAY_ORDER[number];
type WeekDayValue = Exclude<DayValue, 'DAILY'>;

const DAY_OPTIONS: Array<{ label: string; value: DayValue }> = [
  { label: 'Lunes', value: 'MONDAY' },
  { label: 'Martes', value: 'TUESDAY' },
  { label: 'Miércoles', value: 'WEDNESDAY' },
  { label: 'Jueves', value: 'THURSDAY' },
  { label: 'Viernes', value: 'FRIDAY' },
  { label: 'Sábado', value: 'SATURDAY' },
  { label: 'Domingo', value: 'SUNDAY' },
  { label: 'Todos los días', value: 'DAILY' }
];

const isDayValue = (value: string): value is DayValue => {
  return (DAY_ORDER as readonly string[]).includes(value);
};

const WEEK_DAYS: WeekDayValue[] = DAY_ORDER.filter(
  (day): day is WeekDayValue => day !== 'DAILY'
);

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

  selectedDays: DayValue[] = [];
  daysOfWeekString = '';
  startTime = '';
  endTime = '';
  isTimeRangeValid = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['draft']) {
      const raw = this.normalizeDays(this.draft?.days_of_week);
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

  private normalizeDays(value: unknown): DayValue[] {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.filter((day): day is DayValue => isDayValue(String(day)));
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map(day => day.trim())
        .filter(isDayValue);
    }
    return [];
  }

  private syncSelections(days: DayValue[]): void {
    const normalized = this.applyDailyRules(days);
    const sorted = this.sortDays(normalized);
    this.selectedDays = sorted;
    this.daysOfWeekString = sorted.join(',');
    this.draft = {
      ...this.draft,
      days_of_week: [...sorted]
    };
  }

  private sortDays(days: DayValue[]): DayValue[] {
    const orderMap = new Map(this.dayOrder.map((day, index) => [day, index]));
    return Array.from(new Set(days)).sort(
      (a, b) => (orderMap.get(a)! - orderMap.get(b)!)
    );
  }

  private applyDailyRules(days: DayValue[]): DayValue[] {
    const unique = Array.from(new Set(days));
    const hasDaily = unique.includes('DAILY');
    const regularDays = unique.filter(
      (day): day is WeekDayValue => day !== 'DAILY'
    );

    if (hasDaily) {
      return ['DAILY'];
    }

    const hasAllWeekDays = WEEK_DAYS.every(day => regularDays.includes(day));
    if (hasAllWeekDays && regularDays.length === WEEK_DAYS.length) {
      return ['DAILY'];
    }

    return regularDays;
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
