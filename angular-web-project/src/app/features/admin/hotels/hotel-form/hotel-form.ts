import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AmenitiesService } from '../../../../services/amenities';
import { environment } from '../../../../../environments/environment';

interface Hotel {
  hotel_id: number;
  name: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  check_in_after?: string;   // "HH:mm"
  check_out_before?: string; // "HH:mm"
  image?: string;
  amenities?: Amenity[];
}

interface Amenity {
  amenity_id: number;
  name: string;
}

export interface HotelFormPayload {
  draft: Partial<Hotel>;
  amenityIds: number[];
}

@Component({
  selector: 'app-hotel-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotel-form.html',
  styleUrls: ['./hotel-form.css']
})
export class HotelFormComponent implements OnInit {
  @Input() hotel?: Hotel;
  @Input() loading = false;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<HotelFormPayload>();

  private amenitiesApi = inject(AmenitiesService);

  draft: Partial<Hotel> = {};
  allAmenities: Amenity[] = [];
  editAmenityIds = new Set<number>();
  imgBroken = false;

  // Base del backend para imágenes
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  constructor() {}

  ngOnInit(): void {
    if (this.hotel) {
      this.draft = { ...this.hotel };
      this.editAmenityIds = new Set<number>((this.hotel.amenities || []).map(a => a.amenity_id));
    }
    
    this.amenitiesApi.list().subscribe(a => this.allAmenities = a);
  }

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  submit(): void {
    if (!this.draft.name?.trim()) return;

    this.onSave.emit({
      draft: { ...this.draft },
      amenityIds: Array.from(this.editAmenityIds)
    });
  }

  cancelEdit(): void {
    this.onCancel.emit();
  }

  toggleEditAmenity(id: number, checked: boolean): void {
    if (checked) {
      this.editAmenityIds.add(id);
    } else {
      this.editAmenityIds.delete(id);
    }
  }

  onImageError(): void {
    this.imgBroken = true;
  }

  onImageLoad(): void {
    this.imgBroken = false;
  }
}