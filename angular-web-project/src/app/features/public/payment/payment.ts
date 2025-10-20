import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PaymentService } from '../../../services/payment';
import { PaymentMethodService } from '../../../services/payment-method';
import { ReservationService } from '../../../services/reservation';
import { UsersService } from '../../../services/users';
import { PaymentMethod } from '../../../model/payment-method';
import { Reservation } from '../../../model/reservation';
import { User } from '../../../model/user';

@Component({
	selector: 'app-payment',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule],
	templateUrl: './payment.html',
	styleUrls: ['./payment.scss']
})
export class PaymentComponent implements OnInit {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private paymentSvc = inject(PaymentService);
	private paymentMethodSvc = inject(PaymentMethodService);
	private reservationSvc = inject(ReservationService);
	private usersSvc = inject(UsersService);

	// Datos
	reservationId: number | null = null;
	reservation: Reservation | null = null;
	currentUser: User | null = null;
	paymentMethods: PaymentMethod[] = [];

	// Formulario
	selectedPaymentMethodId: number | null = null;
	showNewPaymentForm = false;
	newPaymentMethod = {
		type: 'TARJETA' as 'TARJETA' | 'PAYPAL' | 'EFECTIVO',
		holderName: '',
		last4: '',
		billingAddress: ''
	};

	// Tarjeta nueva
	cardNumber = '';
	cardExpiry = '';
	cardCVV = '';

	// Estados
	isLoading = true;
	isProcessing = false;
	loadError = '';
	paymentError = '';
	paymentSuccess = false;

	// Precios
	subtotal: number = 0;
	taxes: number = 0;
	total: number = 0;

	ngOnInit() {
		this.reservationId = Number(this.route.snapshot.queryParamMap.get('reservationId'));

		if (!this.reservationId) {
			this.loadError = 'No se encontró el ID de la reserva.';
			this.isLoading = false;
			return;
		}

		this.loadData();
	}

	private loadData(): void {
		this.usersSvc.getMe().subscribe({
			next: (user) => {
				this.currentUser = user;
				this.loadReservation();
				this.loadPaymentMethods();
			},
			error: (err) => {
				console.error('Error loading user:', err);
				this.loadError = 'Error al cargar los datos del usuario.';
				this.isLoading = false;
			}
		});
	}

	private loadReservation(): void {
		this.reservationSvc.getById(this.reservationId!).subscribe({
			next: (reservation) => {
				this.reservation = reservation;
				this.calculatePrices();
				this.isLoading = false;
			},
			error: (err) => {
				console.error('Error loading reservation:', err);
				this.loadError = 'Error al cargar la reserva.';
				this.isLoading = false;
			}
		});
	}

	private loadPaymentMethods(): void {
		this.paymentMethodSvc.getMy(this.currentUser!.user_id).subscribe({
			next: (methods) => {
				this.paymentMethods = methods ?? [];
				if (this.paymentMethods.length > 0) {
					const firstId = (this.paymentMethods[0] as any).method_id
						?? (this.paymentMethods[0] as any).id
						?? (this.paymentMethods[0] as any).payment_method_id;
					this.selectedPaymentMethodId = this.toNumber(firstId);
					this.showNewPaymentForm = false;
				} else {
					this.selectedPaymentMethodId = null;
					this.showNewPaymentForm = true;
				}
			},
			error: (err) => console.error('Error loading payment methods:', err)
		});
	}

	private calculatePrices(): void {
		if (this.isBrowser()) {
			const priceData = localStorage.getItem('reservationPricing');
			if (priceData) {
				try {
					const pricing = JSON.parse(priceData);
					this.subtotal = pricing.subtotal || 0;
					this.taxes = pricing.taxes || 0;
					this.total = pricing.total || 0;
					return;
				} catch (error) {
					console.error('Error parsing price data from localStorage:', error);
				}
			}
		}
	}

	toggleNewPaymentForm(): void {
		if (!this.showNewPaymentForm) {
			this.selectedPaymentMethodId = null;
		} else {
			if (this.paymentMethods.length) {
				const firstId = (this.paymentMethods[0] as any).method_id
					?? (this.paymentMethods[0] as any).id
					?? (this.paymentMethods[0] as any).payment_method_id;
				this.selectedPaymentMethodId = this.toNumber(firstId);
			}
		}
		this.showNewPaymentForm = !this.showNewPaymentForm;
	}

	formatCardNumber(): void {
		this.cardNumber = this.cardNumber.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
	}

	formatExpiry(): void {
		this.cardExpiry = this.cardExpiry.replace(/\//g, '').replace(/(\d{2})(\d)/, '$1/$2');
	}

	async processPayment(): Promise<void> {
		this.paymentError = '';
		this.isProcessing = true;

		try {
			if (!this.showNewPaymentForm && !this.selectedPaymentMethodId && this.paymentMethods.length) {
				const firstId = (this.paymentMethods[0] as any).method_id
					?? (this.paymentMethods[0] as any).id
					?? (this.paymentMethods[0] as any).payment_method_id;
				this.selectedPaymentMethodId = this.toNumber(firstId);
			}

			let paymentMethodId = this.selectedPaymentMethodId;

			if (this.showNewPaymentForm) {
				const last4 = this.cardNumber.replace(/\s/g, '').slice(-4);

				const newMethod = await firstValueFrom(
					this.paymentMethodSvc.create({
						user_id: this.currentUser!.user_id!,
						type: this.newPaymentMethod.type,
						holder_name: this.newPaymentMethod.holderName,
						last4,
						billing_address: this.newPaymentMethod.billingAddress
					})
				);

				const newId = (newMethod as any).method_id
					?? (newMethod as any).id
					?? (newMethod as any).payment_method_id;
				paymentMethodId = this.toNumber(newId);

				if (!Number.isFinite(paymentMethodId)) {
					throw new Error('No se pudo obtener el ID del nuevo método de pago.');
				}
			}

			if (paymentMethodId == null || Number.isNaN(paymentMethodId)) {
				this.paymentError = 'Debe seleccionar un método de pago.';
				this.isProcessing = false;
				return;
			}

			const payment = await firstValueFrom(
				this.paymentSvc.create({
					reservation_id: this.reservationId!,
					payment_method_id: paymentMethodId,
					amount: this.total,
					status: 'PENDING'
				})
			);

			this.paymentSuccess = true;
			this.isProcessing = false;

			if (this.isBrowser()) localStorage.removeItem('reservationPricing');

			setTimeout(() => {
				this.router.navigate(['/reservation-confirmation'], {
					queryParams: { 
						reservationId: this.reservationId,
						paymentId: payment.payment_id
					}
				});
			}, 2000);

		} catch (error: any) {
			console.error('Error processing payment:', error);
			this.paymentError = error?.error?.message || error?.message || 'Error al procesar el pago. Intente nuevamente.';
			this.isProcessing = false;
		}
	}

	goBack(): void {
		this.router.navigate(['/reservation-summary'], {
			queryParams: { reservationId: this.reservationId }
		});
	}

	formatCurrency(amount: number): string {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount).replace('COP', '').trim() + ' COP';
	}

	getPaymentTypeIcon(type: string): string {
		const icons: { [key: string]: string } = {
			'TARJETA': '💳',
			'PAYPAL': '🅿️',
			'EFECTIVO': '💵'
		};
		return icons[type] || '💳';
	}

	getPaymentTypeName(type: string): string {
		const names: { [key: string]: string } = {
			'TARJETA': 'Tarjeta de Crédito/Débito',
			'PAYPAL': 'PayPal',
			'EFECTIVO': 'Efectivo'
		};
		return names[type] || type;
	}

	toNumber(v: any): number { return typeof v === 'number' ? v : Number(v); }
	trackMethod = (_: number, m: PaymentMethod) => this.toNumber((m as any).method_id ?? (m as any).id ?? (m as any).payment_method_id);

	get canPay(): boolean {
		if (this.isProcessing) return false;
		if (this.showNewPaymentForm) return true;
		return this.selectedPaymentMethodId != null && !Number.isNaN(this.selectedPaymentMethodId);
	}

	private isBrowser(): boolean {
		return typeof window !== 'undefined';
	}
}
