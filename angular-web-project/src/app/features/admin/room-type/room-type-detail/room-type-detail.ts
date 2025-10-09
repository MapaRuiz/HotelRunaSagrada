import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RoomType } from '../../../../model/room-type';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-room-type-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-type-detail.html',
  styleUrls: ['./room-type-detail.css', '../room-type-form/room-type-form.css']
})
export class RoomTypeDetailComponent {
  @Input() roomType?: RoomType;
  @Output() editRequested = new EventEmitter<RoomType>();

  readonly fallbackText = 'Sin información';

  // Base del backend para imágenes
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  beginEdit(): void {
    if (!this.roomType) return;
    this.editRequested.emit(this.roomType);
  }
}