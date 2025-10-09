import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-detail.html',
  styleUrls: ['./hotel-detail.css', '../hotel-form/hotel-form.css']
})
export class HotelDetailComponent {
  @Input() hotel?: Hotel;
  @Output() editRequested = new EventEmitter<Hotel>();

  readonly fallbackText = 'Sin información';

  // Base del backend para imágenes
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  beginEdit(): void {
    if (!this.hotel) return;
    this.editRequested.emit(this.hotel);
  }
}