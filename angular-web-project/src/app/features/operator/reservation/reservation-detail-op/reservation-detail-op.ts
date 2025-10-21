import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation } from '../../../../model/reservation';
import { ReservationService } from '../../../../services/reservation';
import { ServicesAddForm } from '../services-add-form/services-add-form';
import { ReservationServicesTable } from '../reservation-services-table/reservation-services-table';
import { ReservationFacade, getStatusBadge, getStatusText } from '../reservation';
import { BillServicesComponent } from '../bill-services/bill-services';
import { ReservationService as ReservationServiceModel } from '../../../../model/reservation-service';
import { PaymentMethodService } from '../../../../services/payment-method';
import { PaymentService } from '../../../../services/payment';
import { PaymentMethod } from '../../../../model/payment-method';
import { UserDetailComponent } from '../../../admin/users/user-detail/user-detail';

@Component({
  selector: 'app-reservation-detail-op',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ServicesAddForm,
    UserDetailComponent,
    ReservationServicesTable,
    BillServicesComponent,
  ],
  templateUrl: './reservation-detail-op.html',
  styleUrls: [
    './reservation-detail-op.css',
    '../../../admin/reservation/reservation-detail/reservation-detail.css',
    '../../../admin/reservation/reservation-table/reservation-table.css',
  ],
})
export class ReservationDetailOp {
  @Input() reservation?: Reservation;
  @ViewChild(ReservationServicesTable) servicesTable?: ReservationServicesTable;
  @ViewChild(BillServicesComponent) billComp?: BillServicesComponent;

  @Output() servicesModified = new EventEmitter<ReservationService[]>();
  @Output() addServicesRequested = new EventEmitter<Reservation>();
  @Output() editingChanged = new EventEmitter<boolean>();
  @Output() closeRequested = new EventEmitter<void>();

  editingServices = false;
  editingService: ReservationServiceModel | null = null;

  badge = getStatusBadge;
  text = getStatusText;

  private facade = inject(ReservationFacade);
  private paymentMethodSvc = inject(PaymentMethodService);
  private paymentSvc = inject(PaymentService);
  private childSub?: Subscription;
  private facadeSub?: Subscription;

  // Billing state provided by bill component
  billSubtotal = 0;
  billTaxes = 0;
  billTotal = 0;
  // Payment selection state
  paymentMethods: PaymentMethod[] = [];
  selectedPaymentMethodId: number | null = null;
  showingPayment = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservation'] && this.reservation?.reservation_id) {
      // Load services via facade to keep data fresh
      const rid = this.reservation.reservation_id;
      this.facade.getReservationServices(rid).subscribe({
        next: (svcs) => {
          if (this.reservation) {
            // attach fetched services into the current reservation for template reuse
            (this.reservation as any).services = svcs;
          }
        },
        error: () => {
          // ignore errors here; UI will show empty services
        },
      });

      // Ensure we have the reservation user and load payment methods via facade
      const uid = this.reservation.user?.user_id ?? this.reservation.user_id;
      if (uid) {
        this.facade.getUserById(uid).subscribe({
          next: (u) => this.onBillUserChanged(u as any),
          error: () => this.onBillUserChanged(undefined),
        });
      } else {
        this.onBillUserChanged(undefined);
      }
    }
  }

  ngAfterViewInit(): void {
    // Subscribe to child's editRequested as an additional check
    setTimeout(() => {
      if (!this.servicesTable) {
        return;
      }
      this.childSub = this.servicesTable.editRequested.subscribe((row) => {
        // forward to existing handler
        this.onEditReservationService(row);
      });
    }, 0);
  }

  ngOnInit(): void {
    // subscribe to facade selection channel
    this.facadeSub = this.facade.selectedReservationService$.subscribe((row) => {
      this.onEditReservationService(row);
    });
  }

  ngOnDestroy(): void {
    if (this.childSub) this.childSub.unsubscribe();
    if (this.facadeSub) this.facadeSub.unsubscribe();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return this.fallbackText;

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  readonly fallbackText = 'Sin información';

  addServices() {
    if (this.reservation) {
      this.addServicesRequested.emit(this.reservation);
    }
    this.editingServices = true;
    this.editingService = null;
    this.editingChanged.emit(true);
  }

  closeServices() {
    this.editingServices = false;
    this.editingChanged.emit(false);
    // refresh table after closing form (save/cancel)
    this.servicesTable?.onContainerShown();
    this.billComp?.reload();
  }

  closeDetail() {
    this.closeRequested.emit();
  }

  calculateNights(): number {
    if (!this.reservation?.check_in || !this.reservation?.check_out) return 0;

    try {
      const checkIn = new Date(this.reservation.check_in);
      const checkOut = new Date(this.reservation.check_out);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }

  // Triggered when the collapse containing the services table is shown
  onServicesCollapseShown() {
    this.servicesTable?.onContainerShown();
  }

  onEditReservationService(row: ReservationServiceModel) {
    // store selected row and enable edit mode so the template will render the form
    this.editingService = row;
    this.editingServices = true;
    this.editingChanged.emit(true);

    // Ensure the accordion panel with id `collapseTwo` is open so the form is visible.
    // Prefer to use the Bootstrap Collapse instance if available; otherwise toggle classes
    // without requiring a global `bootstrap` symbol (avoids TS errors at build time).
    const collapseEl = document.getElementById('collapseTwo');
    if (collapseEl) {
      // If Bootstrap 5 Collapse instance is exposed on the element, call 'show'
      // (Bootstrap stores instances on element via Element["bsCollapse"] in some builds,
      // but we can't rely on that. Use classList and attributes as fallback.)
      const isShown = collapseEl.classList.contains('show');
      if (!isShown) {
        // Add classes expected by Bootstrap to show the collapse
        collapseEl.classList.add('show');
        collapseEl.setAttribute('aria-expanded', 'true');
        // The collapse container parent button usually has aria-controls and aria-expanded attributes.
        // Try to find the controlling button and update it too.
        try {
          const controller = document.querySelector(
            '[data-bs-target="#collapseTwo"], [data-bs-toggle][data-bs-target="#collapseTwo"]'
          ) as HTMLElement | null;
          if (controller) {
            controller.setAttribute('aria-expanded', 'true');
          }
        } catch {}
        // After making it visible, refresh the inner table so columns size correctly
        setTimeout(() => this.servicesTable?.onContainerShown(), 0);
      } else {
        // already visible; still refresh
        setTimeout(() => this.servicesTable?.onContainerShown(), 0);
      }
    }
  }

  // Receive totals/user from bill component
  onBillTotalsChanged(ev: { subtotal: number; taxes: number; total: number }) {
    this.billSubtotal = ev.subtotal;
    this.billTaxes = ev.taxes;
    this.billTotal = ev.total;
  }

  onBillUserChanged(user?: { user_id?: number }) {
    if (!user?.user_id) {
      this.paymentMethods = [];
      this.selectedPaymentMethodId = null;
      console.debug('No user or user_id provided; cleared payment methods.');
      return;
    }
    this.paymentMethodSvc.getMy(user.user_id).subscribe({
      next: (methods) => {
        this.paymentMethods = methods ?? [];
        const firstId =
          (this.paymentMethods[0] as any)?.method_id ??
          (this.paymentMethods[0] as any)?.id ??
          (this.paymentMethods[0] as any)?.payment_method_id;
        this.selectedPaymentMethodId = this.toNumber(firstId);
      },
      error: () => {
        this.paymentMethods = [];
        this.selectedPaymentMethodId = null;
      },
    });
  }

  // Pay total
  togglePayment() {
    if (this.billTotal <= 0) return;
    this.showingPayment = !this.showingPayment;
  }

  confirmPayTotal() {
    if (!this.reservation?.reservation_id || !this.selectedPaymentMethodId) return;
    const payload = {
      reservation_id: this.reservation.reservation_id,
      payment_method_id: this.selectedPaymentMethodId,
      amount: this.billTotal,
      status: 'PAID' as const,
    };
    this.paymentSvc.create(payload).subscribe({
      next: () => {
        alert('Pago registrado');
        this.showingPayment = false;
        this.billComp?.reload();
      },
      error: () => alert('No se pudo registrar el pago'),
    });
  }

  // helpers for payment methods UI
  toNumber(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  trackMethod = (_: number, m: any) => m?.method_id ?? m?.id ?? m?.payment_method_id ?? _;
  getPaymentTypeIcon(type: string) {
    const map: any = { TARJETA: '💳', PAYPAL: '🅿️', EFECTIVO: '💵' };
    return map[type] ?? '💳';
  }
  getPaymentTypeName(type: string) {
    const map: any = { TARJETA: 'Tarjeta', PAYPAL: 'PayPal', EFECTIVO: 'Efectivo' };
    return map[type] ?? type;
  }
}
