import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Room } from '../../../../model/room';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-detail.html',
  styleUrls: ['./room-detail.css', '../room-table/room-table.css'],
})
export class RoomDetail implements OnChanges {
  @Input() room?: Room;

  @Output() editRequested = new EventEmitter<Room>();

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
    const total = this.room?.images?.length ?? 0;
    if (total === 0) return;
    this.activeSlide = (this.activeSlide - 1 + total) % total;
  }

  next(): void {
    const total = this.room?.images?.length ?? 0;
    if (total === 0) return;
    this.activeSlide = (this.activeSlide + 1) % total;
  }

  onImageLoaded(index: number): void { this.imageStatus[index] = 'loaded'; }
  onImageError(index: number): void { this.imageStatus[index] = 'error'; }

  beginEdit(): void {
    if (!this.room) return;
    this.editRequested.emit(this.room);
  }

  getResStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'BOOKED': return 'Reservada';
      case 'OCCUPIED': return 'Ocupada';
      case 'MAINTENANCE': return 'Mantenimiento';
      default: return status || 'N/A';
    }
  }

  getResStatusBadge(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'text-bg-success';
      case 'BOOKED': return 'text-bg-primary';
      case 'OCCUPIED': return 'text-bg-info';
      case 'MAINTENANCE': return 'text-bg-danger';
      default: return 'text-bg-secondary';
    }
  }

  getCleStatusText(status: string): string {
    return status === 'DIRTY' ? 'Sucia' : 'Limpia';
  }

  getCleStatusBadge(status: string): string {
    return status === 'DIRTY' ? 'text-bg-warning' : 'text-bg-success';
  }

  private syncImageStatus(): void {
    const length = this.room?.images?.length ?? 0;
    this.imageStatus = Array.from({ length }, () => 'idle');
    this.activeSlide = 0;
    this.normalizeActiveSlide();
  }

  private normalizeActiveSlide(): void {
    const total = this.room?.images?.length ?? 0;
    if (total === 0) {
      this.activeSlide = 0;
      return;
    }
    if (this.activeSlide >= total) this.activeSlide = total - 1;
    if (this.activeSlide < 0) this.activeSlide = 0;
  }
}