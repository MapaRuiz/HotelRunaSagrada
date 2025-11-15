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
import { TaskService } from '../../../../services/task';
import { AuthService } from '../../../../services/auth';
import { Task } from '../../../../model/task';
import { PaymentService } from '../../../../services/payment';
import { PaymentMethodService } from '../../../../services/payment-method';
import { of, switchMap } from 'rxjs';

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
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private paymentSvc = inject(PaymentService);
  private paymentMethodSvc = inject(PaymentMethodService);
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
    if (
      this.errorMsg === 'Seleccione un horario válido para el servicio.' ||
      this.errorMsg === 'Debe seleccionar un horario para el servicio.'
    ) {
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
        next: (resService) => {
          // Registrar/actualizar un pago pendiente por los servicios contratados
          this.ensureServicePayment(body);
          const selectedService = this.services.find((s) => s.id === this.service_id);
          console.log(this.reservation);
          if (selectedService) {
            const currentUser = this.authService.userSnapshot();
            const category = selectedService.category.toLowerCase();
            let type: 'DELIVERY' | 'GUIDING' | 'TO_DO' | undefined;
            if (category === 'gastronomía') type = 'DELIVERY';
            else if (category === 'tours') type = 'GUIDING';
            else if (category === 'cultural') type = 'TO_DO';

            if (type) {
              this.taskService
                .create({
                  type,
                  status: 'PENDING',
                  res_service_id: resService?.res_service_id,
                  room_id: this.reservation?.room_id ?? undefined,
                })
                .subscribe({
                  next: () => {
                    this.loading = false;
                    this.saved.emit();
                  },
                  error: () => {
                    this.loading = false;
                    this.errorMsg = 'No se pudo crear la tarea.';
                  },
                });
            } else {
              this.loading = false;
              this.saved.emit();
            }
          } else {
            this.loading = false;
            this.saved.emit();
          }
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

  /**
   * Crea o acumula un pago pendiente para los servicios de la reserva.
   * Usa el primer método de pago del usuario; si ya existe un pago con
   * referencia "Servicios Reserva", se incrementa su monto.
   * No bloquea el flujo principal si falla.
   */
  private ensureServicePayment(body: ReservationServiceRequest) {
    const reservationId = body.reservation_id;
    const userId = this.reservation?.user?.user_id ?? this.reservation?.user_id;
    if (!reservationId || !userId) return;

    const amount = Number(body.qty ?? 0) * Number(body.unit_price ?? 0);
    if (!amount || amount <= 0) return;

    const serviceRef = `SERVICIOS RESERVA ${reservationId}`;

    this.paymentMethodSvc
      .getMy(userId)
      .pipe(
        switchMap((methods) => {
          const firstId =
            (methods[0] as any)?.method_id ??
            (methods[0] as any)?.id ??
            (methods[0] as any)?.payment_method_id;
          const pmId = Number(firstId);
          if (!Number.isFinite(pmId)) {
            return of(null);
          }
          return this.paymentSvc.getByReservation(reservationId).pipe(
            switchMap((payments) => {
              const existing = (payments || []).find((p) =>
                (p.tx_reference ?? '').toString().trim().toUpperCase().includes(serviceRef)
              );
              if (existing?.payment_id) {
                const newAmount = Number(existing.amount || 0) + amount;
                const normalized = (existing.status ?? 'PENDING').toString().trim().toUpperCase();
                const safeStatus: 'PENDING' | 'PAID' | 'REFUNDED' =
                  normalized === 'PAID' || normalized === 'REFUNDED' ? normalized : 'PENDING';
                return this.paymentSvc.update(existing.payment_id, {
                  amount: newAmount,
                  status: safeStatus,
                });
              }
              return this.paymentSvc.create({
                reservation_id: reservationId,
                payment_method_id: pmId,
                amount,
                status: 'PENDING',
                tx_reference: 'Servicios Reserva',
              });
            })
          );
        })
      )
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }
}
