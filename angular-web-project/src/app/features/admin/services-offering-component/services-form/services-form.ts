import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceOffering } from '../../../../model/service-offering';
import { ServicesScheduleTable } from "../services-schedule-table/services-schedule-table";
import { ServiceSchedule } from '../../../../model/service-schedule';
import { ServiceScheduleForm } from "../service-schedule-form/service-schedule-form";
import { ServiceScheduleRequest } from '../../../../services/service-offering-service';

export interface ServicesFormPayload {
  draft: Partial<ServiceOffering>;
  deleteIds: number[];
  newSchedules: ServiceScheduleRequest[];
  updatedSchedules: { id: number; request: ServiceScheduleRequest }[];
}

interface PendingScheduleSave {
  tempId: number;
  request: ServiceScheduleRequest;
}

interface PendingScheduleUpdate {
  id: number;
  request: ServiceScheduleRequest;
}


@Component({
  selector: 'app-services-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ServicesScheduleTable, ServiceScheduleForm],
  templateUrl: './services-form.html',
  styleUrls: ['./services-form.css']
})
export class ServicesFormComponent {
  categorias: string[] = [ 'Cultural', 'Experiencias', 'Gastronomía', 'Tours'];

  @Input() draft: Partial<ServiceOffering> = {};
  @Input() hotels: { id: number; name: string }[] = [];
  @Input() loading = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<ServicesFormPayload>();

  @ViewChild('scheduleDetails') private scheduleDetails?: ElementRef<HTMLDetailsElement>;

  newImageUrl = '';
  imageStatus: ('idle' | 'loaded' | 'error')[] = [];
  displayMode: 'carousel' | 'list' = 'carousel';
  activeSlide = 0;
  pendingDeletes = new Set<number>();
  showScheduleForm = false;
  scheduleDraft: Partial<ServiceSchedule> | null = null;
  editingSchedule: ServiceSchedule | null = null;
  editingScheduleDraft: Partial<ServiceSchedule> | null = null;

  private nextTempScheduleId = 0;
  private pendingSchedules: PendingScheduleSave[] = [];
  private pendingUpdates: PendingScheduleUpdate[] = [];

  constructor() {}

  get carouselId(): string {
    const id = this.draft.id ?? 'temp';
    return `serviceImages-${id}`;
  }

  ngOnChanges(): void {
    this.syncImageStatus();

    if (this.editingSchedule) {
      const schedules = this.draft.schedules ?? [];
      if (!schedules.some(item => item.id === this.editingSchedule?.id)) {
        this.cancelScheduleEdit();
      }
    }
  }

  submit(): void {
    const deleteIds = Array.from(this.pendingDeletes);

    this.pendingDeletes.clear();
    this.save.emit({
      draft: { ...this.draft },
      deleteIds,
      newSchedules: this.pendingSchedules.map(item => item.request),
      updatedSchedules: [...this.pendingUpdates]
    });

    this.pendingSchedules = [];
    this.pendingUpdates = [];
  }

  addImage(): void {
    const url = this.newImageUrl.trim();
    if (!url) return;
    this.draft.image_urls ??= [];
    this.draft.image_urls.push(url);
    this.newImageUrl = '';
    this.imageStatus.push('idle');
    this.activeSlide = this.draft.image_urls.length - 1;
  }

  removeImage(index: number): void {
    this.draft.image_urls?.splice(index, 1);
    this.imageStatus.splice(index, 1);
    this.normalizeActiveSlide();
  }

  removeActiveImage(): void {
    if ((this.draft.image_urls?.length ?? 0) === 0) return;
    this.removeImage(this.activeSlide);
  }

  trackByIndex(index: number): number { return index; }

  onImageLoaded(i: number): void { this.imageStatus[i] = 'loaded'; }
  onImageError(i: number): void { this.imageStatus[i] = 'error'; }

  setDisplayMode(mode: 'carousel' | 'list'): void {
    if (this.displayMode !== mode) this.displayMode = mode;
  }

  prev(): void {
    const n = this.draft.image_urls?.length ?? 0;
    if (n === 0) return;
    this.activeSlide = (this.activeSlide - 1 + n) % n;
  }

  next(): void {
    const n = this.draft.image_urls?.length ?? 0;
    if (n === 0) return;
    this.activeSlide = (this.activeSlide + 1) % n;
  }

  deleteSchedule(schedule: ServiceSchedule): void {
    const previous = this.draft.schedules ?? [];
    this.draft = {
      ...this.draft,
      schedules: previous.filter(item => item.id !== schedule.id)
    };

    if (schedule.id > 0) {
      this.pendingDeletes.add(schedule.id);
    } else {
      this.pendingSchedules = this.pendingSchedules.filter(item => item.tempId !== schedule.id);
    }
  }

  editSchedule(schedule: ServiceSchedule): void {
    this.cancelSchedule();
    this.editingSchedule = schedule;
    this.editingScheduleDraft = {
      ...schedule,
      days_of_week: [...(schedule.days_of_week ?? [])]
    };
  }

  saveScheduleEdit(schedule: ServiceSchedule): void {
    if (!this.editingSchedule) return;
    const targetId = this.editingSchedule.id;
    const request = this.toScheduleRequest(schedule);

    if (targetId > 0) {
      this.pendingUpdates = [
        { id: targetId, request },
        ...this.pendingUpdates.filter(item => item.id !== targetId)
      ];
    } else {
      this.pendingSchedules = [
        { tempId: targetId, request },
        ...this.pendingSchedules.filter(item => item.tempId !== targetId)
      ];
    }

    const previous = this.draft.schedules ?? [];
    const sanitized: ServiceSchedule = {
      ...this.editingSchedule,
      ...schedule,
      id: targetId,
      days_of_week: [...request.days_of_week],
      start_time: request.start_time,
      end_time: request.end_time,
      active: request.active
    };
    const remaining = previous.filter(item => item.id !== targetId);
    this.draft = {
      ...this.draft,
      schedules: [sanitized, ...remaining]
    };

    this.cancelScheduleEdit();
  }

  cancelScheduleEdit(): void {
    this.editingSchedule = null;
    this.editingScheduleDraft = null;
  }

  private syncImageStatus(): void {
    this.imageStatus = (this.draft.image_urls ?? []).map(() => 'idle');
    this.activeSlide = 0;
    this.normalizeActiveSlide();
  }

  private normalizeActiveSlide(): void {
    const n = this.draft.image_urls?.length ?? 0;
    if (n === 0) { this.activeSlide = 0; return; }
    if (this.activeSlide >= n) this.activeSlide = n - 1;
    if (this.activeSlide < 0) this.activeSlide = 0;
  }

  // Schedule Creation
  onScheduleToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.showScheduleForm = details.open;
    if (details.open) {
      this.scheduleDraft = this.buildEmptySchedule();
    } else {
      this.scheduleDraft = null;
    }
  }

  cancelSchedule(): void {
    this.scheduleDraft = null;
    this.showScheduleForm = false;

    const details = this.scheduleDetails?.nativeElement;
    if (details) {
      details.open = false;
      details.removeAttribute('open');
    }
  }

  saveSchedule(schedule: ServiceSchedule): void {
    const request = this.toScheduleRequest(schedule);
    const tempId = this.getNextTempScheduleId();

    const model: ServiceSchedule = {
      id: tempId,
      days_of_week: [...request.days_of_week],
      start_time: request.start_time,
      end_time: request.end_time,
      active: request.active
    };

    const previous = this.draft.schedules ?? [];
    this.draft = {
      ...this.draft,
      schedules: [...previous, model]
    };

    this.pendingSchedules.push({ tempId, request });
    this.cancelSchedule();
  }

  private buildEmptySchedule(): Partial<ServiceSchedule> {
    return { days_of_week: [], start_time: '', end_time: '', active: true };
  }

  private toScheduleRequest(schedule: Partial<ServiceSchedule>): ServiceScheduleRequest {
    const raw = Array.isArray(schedule.days_of_week)
      ? schedule.days_of_week
      : (schedule.days_of_week ?? '')
          .toString()
          .split(',')
          .map(day => day.trim())
          .filter(Boolean);

    return {
      days_of_week: raw,
      start_time: schedule.start_time ?? '',
      end_time: schedule.end_time ?? '',
      active: schedule.active ?? true
    };
  }

  private getNextTempScheduleId(): number {
    this.nextTempScheduleId -= 1;
    return this.nextTempScheduleId;
  }
}
