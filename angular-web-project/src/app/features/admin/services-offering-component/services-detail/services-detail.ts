import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ServiceOffering } from '../../../../model/service-offering';
import { ServicesScheduleTable } from "../services-schedule-table/services-schedule-table";

@Component({
  selector: 'app-services-detail',
  standalone: true,
  imports: [CommonModule, ServicesScheduleTable],
  templateUrl: './services-detail.html',
  styleUrls: ['./services-detail.css', '../services-form/services-form.css'],
})
export class ServicesDetail implements OnChanges {
  @Input() service?: ServiceOffering;

  @Output() editRequested = new EventEmitter<ServiceOffering>();

  displayMode: 'carousel' | 'list' = 'carousel';
  imageStatus: ('idle' | 'loaded' | 'error')[] = [];
  activeSlide = 0;
  readonly fallbackText = 'Sin información';

  ngOnChanges(changes: SimpleChanges): void {
    this.syncImageStatus();
  }

  trackByIndex(index: number): number { return index; }

  setDisplayMode(mode: 'carousel' | 'list'): void {
    if (this.displayMode !== mode) this.displayMode = mode;
  }

  prev(): void {
    const total = this.service?.image_urls?.length ?? 0;
    if (total === 0) return;
    this.activeSlide = (this.activeSlide - 1 + total) % total;
  }

  next(): void {
    const total = this.service?.image_urls?.length ?? 0;
    if (total === 0) return;
    this.activeSlide = (this.activeSlide + 1) % total;
  }

  onImageLoaded(index: number): void { this.imageStatus[index] = 'loaded'; }
  onImageError(index: number): void { this.imageStatus[index] = 'error'; }

  beginEdit(): void {
    if (!this.service) return;
    this.editRequested.emit(this.service);
  }

  private syncImageStatus(): void {
    const length = this.service?.image_urls?.length ?? 0;
    this.imageStatus = Array.from({ length }, () => 'idle');
    this.activeSlide = 0;
    this.normalizeActiveSlide();
  }

  private normalizeActiveSlide(): void {
    const total = this.service?.image_urls?.length ?? 0;
    if (total === 0) {
      this.activeSlide = 0;
      return;
    }
    if (this.activeSlide >= total) this.activeSlide = total - 1;
    if (this.activeSlide < 0) this.activeSlide = 0;
  }
}
