import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../../../services/reservation';
import { forkJoin, of, switchMap, catchError } from 'rxjs';
import { ReservationServiceApi } from '../../../../services/reservation-service';
import { ReservationService as ReservationServiceModel } from '../../../../model/reservation-service';
import {
  ServiceOfferingService,
  ServiceOfferingDetailResponse,
} from '../../../../services/service-offering-service';
import { User } from '../../../../model/user';
import { ReservationFacade, getPaymentStatusBadge, getPaymentStatusText } from '../reservation';
import { PaymentService } from '../../../../services/payment';
import { Payment } from '../../../../model/payment';

@Component({
  selector: 'app-bill-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bill-services.html',
  styleUrls: ['./bill-services.css'],
})
export class BillServicesComponent implements OnChanges {
  @Input() reservationId?: number;

  getPaymentStatusBadge = getPaymentStatusBadge;
  getPaymentStatusText = getPaymentStatusText;

  subtotal = 0; // Raw sum of service line items (without taxes)
  serviceSubtotal = 0; // Same as subtotal but kept before tax for clarity
  otherSubtotal = 0; // Pending "Otros" charges (non-paid extra payments)
  otherTotalAll = 0; // Sum of every "Otros" payment regardless of status
  taxes = 0; // Calculated tax amount for services
  total = 0; // Service subtotal plus taxes
  grandTotal = 0; // Amount due while reservation is active (services + pending extras)
  finishedGrandTotal = 0; // Final total once reservation is finished (services + all extras)
  currentUser?: User;
  items: ReservationServiceModel[] = [];
  otherPayments: Payment[] = [];
  pendingOtherPayments: Payment[] = [];
  reservationStatus?: string;

  private reservations = inject(ReservationService);
  private facade = inject(ReservationFacade);
  private resServices = inject(ReservationServiceApi);
  private offerings = inject(ServiceOfferingService);
  private payments = inject(PaymentService);

  // Notify parent when totals/user resolved
  @Output() totalsChanged = new EventEmitter<{
    subtotal: number;
    taxes: number;
    total: number;
    otherSubtotal: number;
    grandTotal: number;
  }>();
  @Output() userChanged = new EventEmitter<User | undefined>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservationId'] && this.reservationId) {
      this.load(this.reservationId);
    }
  }

  private load(id: number) {
    // Fetch reservation (to get user), subtotal (lumpsum) and raw items; then enrich items with service name/schedule
    this.reservations
      .getById(id)
      .pipe(
        switchMap((reservation) => {
          const status = (reservation?.status ?? '').toString().trim().toUpperCase();
          this.reservationStatus = status || undefined;
          // Fetch subtotal, user, items and payments in parallel
          return forkJoin({
            subtotal: this.reservations.lumpSum(id).pipe(catchError(() => of(0))),
            user: reservation?.user_id
              ? this.facade.getUserById(reservation.user_id).pipe(catchError(() => of(undefined)))
              : of(undefined),
            items: this.facade.getReservationServices(id).pipe(catchError(() => of([]))),
            payments: this.payments.getByReservation(id).pipe(catchError(() => of([]))),
          });
        })
      )
      .subscribe({
        next: ({ subtotal, user, items, payments }) => {
          // summary numbers
          const serviceSub = Number(subtotal) || 0;
          this.serviceSubtotal = serviceSub;
          const allPayments = payments ?? [];
          const serviceRef = 'SERVICIOS RESERVA';
          // Separate "Servicios Reserva" payments from "Otros" payments
          this.otherPayments = allPayments.filter((p) => {
            const ref = (p.tx_reference ?? '').toString().trim().toUpperCase();
            return !ref.includes(serviceRef);
          });
          this.otherTotalAll = this.otherPayments.reduce(
            (acc, pay) => acc + Number(pay.amount || 0),
            0
          );
          this.pendingOtherPayments = this.otherPayments.filter((p) => {
            const status = (p.status ?? '').toString().trim().toUpperCase();
            return status !== 'PAID' && status !== 'REFUNDED';
          });
          this.otherSubtotal = this.pendingOtherPayments.reduce(
            (acc, pay) => acc + Number(pay.amount || 0),
            0
          );

          this.subtotal = +serviceSub.toFixed(2);
          this.taxes = +(this.serviceSubtotal * 0.19).toFixed(2);
          this.total = +(this.serviceSubtotal + this.taxes).toFixed(2);
          this.currentUser = user as User | undefined;
          this.grandTotal = +(this.total + this.otherSubtotal).toFixed(2);
          this.finishedGrandTotal = +(this.total + this.otherTotalAll).toFixed(2);
          this.totalsChanged.emit({
            subtotal: this.subtotal,
            taxes: this.taxes,
            total: this.total,
            otherSubtotal: this.otherSubtotal,
            grandTotal: this.grandTotal,
          });
          this.userChanged.emit(this.currentUser);

          const base = items || [];
          if (!base.length) {
            this.items = [];
            return;
          }
          const serviceIds = Array.from(
            new Set(base.map((r) => r.service_id).filter((v): v is number => v != null))
          );
          if (serviceIds.length === 0) {
            this.items = base;
            return;
          }
          // Fetch service offering details to get names/schedules
          forkJoin(serviceIds.map((sid) => this.offerings.getDetail(sid))).subscribe({
            next: (details: ServiceOfferingDetailResponse[]) => {
              const byServiceId = new Map(details.map((d) => [d.service.id, d] as const));
              this.items = base.map((row) => {
                const det = row.service_id != null ? byServiceId.get(row.service_id) : undefined;
                const schedule =
                  row.schedule_id != null
                    ? det?.schedules?.find((s) => s.id === row.schedule_id)
                    : null;
                return {
                  ...row,
                  service: det?.service ?? row.service,
                  schedule: schedule ?? row.schedule ?? null,
                } as ReservationServiceModel;
              });
            },
            error: () => (this.items = base),
          });
        },
        error: () => {
          this.subtotal = 0;
          this.serviceSubtotal = 0;
          this.otherSubtotal = 0;
          this.otherTotalAll = 0;
          this.taxes = 0;
          this.total = 0;
          this.grandTotal = 0;
          this.finishedGrandTotal = 0;
          this.currentUser = undefined;
          this.reservationStatus = undefined;
          this.totalsChanged.emit({
            subtotal: 0,
            taxes: 0,
            total: 0,
            otherSubtotal: 0,
            grandTotal: 0,
          });
          this.userChanged.emit(undefined);
          this.items = [];
          this.otherPayments = [];
          this.pendingOtherPayments = [];
        },
      });
  }

  formatCurrency(value?: number) {
    const v = typeof value === 'number' ? value : 0;
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v);
    } catch {
      return v.toFixed(2);
    }
  }

  getItemSubtotal(item: ReservationServiceModel): number {
    const qty = Number(item?.qty ?? 0);
    const unit = Number(item?.unit_price ?? 0);
    return qty * unit;
  }

  // Allow parent to force a reload
  public reload() {
    if (this.reservationId) {
      this.load(this.reservationId);
    }
  }
}
