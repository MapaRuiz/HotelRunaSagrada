import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation } from '../../../../model/reservation';
import { ServiceOffering } from '../../../../model/service-offering';
import { ServiceSchedule } from '../../../../model/service-schedule';
import { ServiceOfferingService } from '../../../../services/service-offering-service';
import {
  ReservationServiceApi,
  ReservationServiceRequest,
} from '../../../../services/reservation-service';
import {
  ReservationService as ReservationServiceModel,
  res_service_status,
} from '../../../../model/reservation-service';

@Component({
  selector: 'app-services-add-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services-add-form.html',
  styleUrl: './services-add-form.css',
})
export class ServicesAddForm implements OnInit, OnChanges {
  @Input() reservation?: Reservation;
  @Input() edit?: ReservationServiceModel | null;
  @Output() saved = new EventEmitter<void>();
  @Output() canceled = new EventEmitter<void>();

  // Form model
  service_id?: number;
  schedule_id?: number | null;
  qty: number = 1;
  unit_price: number = 0;
  status: res_service_status = 'ORDERED';

  // Data
  services: ServiceOffering[] = [];
  schedules: ServiceSchedule[] = [];
  selectedService?: ServiceOffering;
  selectedSchedule?: ServiceSchedule;
  loading = false;
  errorMsg = '';

  private offeringApi = inject(ServiceOfferingService);
  private resServiceApi = inject(ReservationServiceApi);

  ngOnInit(): void {
    this.loadOfferingsAndPrefill();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If the `edit` input changes while the component is rendered, re-run prefill
    if (changes['edit'] && !changes['edit'].firstChange) {
      this.loadOfferingsAndPrefill();
    }
  }

  private loadOfferingsAndPrefill() {
    if (!this.reservation) return;
    const hotelId = Number(this.reservation.hotel_id);
    this.loading = true;
    this.offeringApi.listByHotel(hotelId).subscribe({
      next: (list) => {
        this.services = list || [];
        this.loading = false;
        if (this.edit) {
          // Prefill edit mode
          this.service_id = this.edit.service_id ?? this.edit.service?.id;
          this.qty = this.edit.qty;
          this.unit_price = this.edit.unit_price;
          this.status = this.edit.status as res_service_status;
          if (this.service_id) {
            this.onServiceChange();
            this.schedule_id = this.edit.schedule_id ?? this.edit.schedule?.id ?? undefined;
          }
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'No se pudieron cargar los servicios.';
      },
    });
  }

  onServiceChange() {
    if (!this.service_id) {
      this.schedules = [];
      this.schedule_id = undefined;
      this.selectedService = undefined;
      this.selectedSchedule = undefined;
      return;
    }
    // When service changes, set suggested unit price from service base_price
    const sel = this.services.find((s) => s.id === this.service_id);
    this.selectedService = sel;

    // If we're editing, only overwrite dependent fields if the service has changed
    const originalServiceId = this.edit?.service_id ?? this.edit?.service?.id;
    const changedService = originalServiceId != null ? originalServiceId !== this.service_id : true;

    if (sel) {
      if (!this.edit || changedService) {
        this.unit_price = sel.base_price ?? this.unit_price;
      }
    }

    this.offeringApi.getSchedules(this.service_id).subscribe({
      next: (sch) => {
        this.schedules = sch || [];
        if (!this.edit || changedService) {
          // If it's a new selection (or creating), pick the first schedule by default
          this.schedule_id = this.schedules[0]?.id;
        }
        this.onScheduleChange();
      },
    });
  }

  onScheduleChange() {
    if (this.schedule_id == null) {
      this.selectedSchedule = undefined;
      return;
    }
    this.selectedSchedule = this.schedules.find((s) => s.id === this.schedule_id);
  }

  onSubmit() {
    // Clamp cantidad mínima
    this.qty = Math.max(1, Number(this.qty) || 1);

    if (!this.reservation || !this.service_id || !this.unit_price) {
      this.errorMsg = 'Complete los campos requeridos.';
      return;
    }
    const body: ReservationServiceRequest = {
      reservation_id: Number(this.reservation.reservation_id),
      service_id: Number(this.service_id),
      schedule_id: this.schedule_id ?? undefined,
      qty: Number(this.qty),
      unit_price: Number(this.unit_price),
      status: this.status,
    };

    this.loading = true;

    if (this.edit?.res_service_id) {
      this.resServiceApi.update(this.edit.res_service_id, body).subscribe({
        next: () => {
          this.loading = false;
          this.saved.emit();
        },
        error: () => {
          this.loading = false;
          this.errorMsg = 'No se pudo actualizar el servicio de reserva.';
        },
      });
    } else {
      this.resServiceApi.add(body).subscribe({
        next: () => {
          this.loading = false;
          this.saved.emit();
        },
        error: (e) => {
          this.loading = false;
          this.errorMsg =
            e?.status === 409
              ? 'El servicio ya existe para esta reserva.'
              : 'No se pudo agregar el servicio.';
        },
      });
    }
  }

  onCancel() {
    this.canceled.emit();
  }

  onQtyChange(value: any) {
    const n = Number(value);
    this.qty = !isNaN(n) && n >= 1 ? n : 1;
  }
}
