// src/app/features/rooms/room-modal/room-modal.component.ts
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HotelsService } from '../../../../services/hotels';
import { RoomTypeService } from '../../../../services/room-type';
import { RoomService } from '../../../../services/room';

@Component({
  selector: 'app-room-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-modal.html',
  styleUrls: ['./room-modal.scss'],
})
export class RoomModalComponent implements OnChanges {
  private hotelSvc = inject(HotelsService, { optional: true });
  private typeSvc = inject(RoomTypeService);
  private roomSvc = inject(RoomService);

  @Input() open = false;
  @Input() reservationId!: number | null;
  @Input() reservationCode = '';
  @Input() hotelId!: number | null;
  @Input() typeId!: number | null;
  @Input() roomId!: number | null;
  @Input() checkIn!: string;
  @Input() checkOut!: string;

  @Output() closed = new EventEmitter<void>();

  hotelName = '';
  roomNumber = '';
  roomFloor: number | null = null;
  roomTheme = '';
  roomTypeName = '';
  capacity: number | null = null;
  basePrice: number | null = null;

  nights = 0;
  estimatedTotal: number | null = null;

  ngOnChanges(_: SimpleChanges): void {
    if (!this.open) return;

    // Noches / estimado
    this.nights = this.calcNights(this.checkIn, this.checkOut);

    // Hotel
    if (this.hotelSvc && this.hotelId) {
      this.hotelSvc.get(this.hotelId).subscribe((h: any) => {
        this.hotelName = h?.name ?? this.hotelName;
      });
    }

    // Room type
    if (this.typeId) {
      this.typeSvc.getById(this.typeId).subscribe((rt: any) => {
        this.roomTypeName = rt?.name ?? '';
        this.capacity = Number(rt?.capacity ?? null);
        const base = Number(rt?.base_price ?? rt?.basePrice);
        this.basePrice = Number.isFinite(base) ? base : null;
        this.estimatedTotal =
          this.basePrice != null && this.nights > 0 ? this.basePrice * this.nights : this.basePrice;
      });
    }

    // Room
    if (this.roomId) {
      (this.roomSvc as any).getById(this.roomId).subscribe(
        (r: any) => {
          this.roomNumber = r?.number ?? '';
          this.roomFloor = Number(r?.floor ?? null);
          this.roomTheme = r?.theme_name ?? r?.themeName ?? '';
        },
        () => {}
      );
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.open) this.close();
  }

  close() {
    this.closed.emit();
  }

  private calcNights(a: string, b: string): number {
    if (!a || !b) return 0;
    const A = new Date(a),
      B = new Date(b);
    return Math.max(0, Math.round((+B - +A) / 86400000));
  }
}
