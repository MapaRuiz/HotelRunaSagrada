import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceOffering } from '../../../../model/service-offering';

@Component({
  selector: 'app-services-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services-form.html',
  styleUrls: ['./services-form.css']
})
export class ServicesFormComponent {
  categorias: string[] = ['Tours', 'Hotel', 'Comida'];

  @Input() draft: Partial<ServiceOffering> = {};
  @Input() hotels: { id: number; name: string }[] = [];
  @Input() loading = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<ServiceOffering>>();

  newImageUrl = '';
  imageStatus: ('idle' | 'loaded' | 'error')[] = [];
  displayMode: 'carousel' | 'list' = 'carousel';
  activeSlide = 0;

  get carouselId(): string {
    const id = this.draft.id ?? 'temp';
    return `serviceImages-${id}`;
  }

  ngOnChanges(): void {
    this.syncImageStatus();
  }

  submit(): void { this.save.emit(this.draft); }

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
}
