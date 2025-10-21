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
import { forkJoin, of, switchMap } from 'rxjs';
import { ReservationServiceApi } from '../../../../services/reservation-service';
import { ReservationService as ReservationServiceModel } from '../../../../model/reservation-service';
import {
  ServiceOfferingService,
  ServiceOfferingDetailResponse,
} from '../../../../services/service-offering-service';
import { User } from '../../../../model/user';
import { ReservationFacade } from '../reservation';

@Component({
  selector: 'app-bill-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bill-services.html',
  styleUrls: ['./bill-services.css'],
})
export class BillServicesComponent implements OnChanges {
  @Input() reservationId?: number;

  subtotal = 0;
  taxes = 0;
  total = 0;
  currentUser?: User;
  items: ReservationServiceModel[] = [];

  private reservations = inject(ReservationService);
  private facade = inject(ReservationFacade);
  private resServices = inject(ReservationServiceApi);
  private offerings = inject(ServiceOfferingService);

  // Notify parent when totals/user resolved
  @Output() totalsChanged = new EventEmitter<{ subtotal: number; taxes: number; total: number }>();
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
        switchMap((reservation) =>
          forkJoin({
            subtotal: this.reservations.lumpSum(id),
            user: reservation?.user_id ? this.facade.getUserById(reservation.user_id) : of(undefined),
            items: this.facade.getReservationServices(id),
          })
        )
      )
      .subscribe({
        next: ({ subtotal, user, items }) => {
          // summary numbers
          const sub = Number(subtotal) || 0;
          this.subtotal = sub;
          this.taxes = +(sub * 0.19).toFixed(2);
          this.total = +(sub + this.taxes).toFixed(2);
          this.currentUser = user as User | undefined;
          this.totalsChanged.emit({
            subtotal: this.subtotal,
            taxes: this.taxes,
            total: this.total,
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
          this.taxes = 0;
          this.total = 0;
          this.currentUser = undefined;
          this.totalsChanged.emit({ subtotal: 0, taxes: 0, total: 0 });
          this.userChanged.emit(undefined);
          this.items = [];
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

  // Allow parent to force a reload
  public reload() {
    if (this.reservationId) {
      this.load(this.reservationId);
    }
  }
}
