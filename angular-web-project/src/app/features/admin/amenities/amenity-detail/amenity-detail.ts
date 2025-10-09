import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Amenity, AmenityType } from '../../../../model/amenity';

@Component({
  selector: 'app-amenity-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './amenity-detail.html',
  styleUrls: ['./amenity-detail.css', '../amenities.css'],
})
export class AmenityDetail implements OnChanges {
  @Input() amenity?: Amenity;

  @Output() editRequested = new EventEmitter<Amenity>();

  readonly fallbackText = 'Sin información';
  imageStatus: 'idle' | 'loaded' | 'error' = 'idle';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['amenity'] && this.amenity) {
      this.imageStatus = 'idle';
    }
  }

  beginEdit(): void {
    if (!this.amenity) return;
    this.editRequested.emit(this.amenity);
  }

  getTypeText(type: AmenityType): string {
    return type === AmenityType.HOTEL ? 'Hotel' : 'Habitación';
  }

  getTypeBadge(type: AmenityType): string {
    return type === AmenityType.HOTEL ? 'text-bg-primary' : 'text-bg-secondary';
  }

  onImageLoaded(): void {
    this.imageStatus = 'loaded';
  }

  onImageError(): void {
    this.imageStatus = 'error';
  }

  getImageUrl(image?: string): string {
    if (!image) return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80';
    return image;
  }
}