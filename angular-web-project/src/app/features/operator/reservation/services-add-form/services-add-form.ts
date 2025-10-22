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
import { formatDaysLabel } from '../../../admin/services-offering-component/service-schedule-form/service-schedule-form';

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
  readonly formatDaysLabel = formatDaysLabel;

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
            const desiredScheduleId = this.edit.schedule_id ?? this.edit.schedule?.id ?? null;
            this.onServiceChange(desiredScheduleId);
          }
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'No se pudieron cargar los servicios.';
      },
    });
  }

  onServiceChange(preferredScheduleId?: number | null) {
    this.errorMsg = '';
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

    this.schedule_id = preferredScheduleId ?? null;
    this.selectedSchedule = undefined;

    this.offeringApi.getSchedules(this.service_id).subscribe({
      next: (sch) => {
        this.schedules = sch || [];
        if (!this.schedules.length) {
          this.schedule_id = undefined;
          this.selectedSchedule = undefined;
          this.errorMsg = 'El servicio seleccionado no tiene horarios disponibles.';
          return;
        }

        const desiredId = preferredScheduleId ?? this.schedule_id;
        const matching = desiredId ? this.schedules.find((s) => s.id === desiredId) : undefined;

        if (!matching) {
          // Pick first schedule available when none selected or previous not found
          this.schedule_id = this.schedules[0]?.id;
        } else {
          this.schedule_id = matching.id;
        }

        this.onScheduleChange();
      },
      error: () => {
        this.schedules = [];
        this.schedule_id = undefined;
        this.selectedSchedule = undefined;
        this.errorMsg = 'No se pudieron cargar los horarios del servicio.';
      },
    });
  }

  onScheduleChange() {
    if (this.schedule_id == null) {
      this.selectedSchedule = undefined;
      return;
    }

    const found = this.schedules.find((s) => s.id === this.schedule_id);
    if (!found) {
      this.selectedSchedule = undefined;
      this.errorMsg = 'Seleccione un horario válido para el servicio.';
      return;
    }
    this.selectedSchedule = found;
    if (this.errorMsg === 'Seleccione un horario válido para el servicio.' ||
        this.errorMsg === 'Debe seleccionar un horario para el servicio.') {
      this.errorMsg = '';
    }
  }

  onSubmit() {
    // Clamp cantidad mínima
    this.qty = Math.max(1, Number(this.qty) || 1);

    if (!this.reservation || !this.service_id || !this.unit_price) {
      this.errorMsg = 'Complete los campos requeridos.';
      return;
    }

    if (this.schedule_id == null) {
      this.errorMsg = 'Debe seleccionar un horario para el servicio.';
      return;
    }
    const body: ReservationServiceRequest = {
      reservation_id: Number(this.reservation.reservation_id),
      service_id: Number(this.service_id),
      schedule_id: Number(this.schedule_id),
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

  formatCurrency(amount?: number | null): string {
    if (amount == null) {
      return 'COP 0';
    }
    return `COP ${new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  }
}
