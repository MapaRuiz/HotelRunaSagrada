import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ReservationService } from '../../../services/reservation';
import { HotelsService } from '../../../services/hotels';
import { RoomTypeService } from '../../../services/room-type';
import { RoomService } from '../../../services/room';
import { UsersService } from '../../../services/users';
import { Reservation } from '../../../model/reservation';
import { User } from '../../../model/user';

@Component({
	selector: 'app-reservation-summary',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './reservation-summary.html',
	styleUrls: ['./reservation-summary.scss']
})
export class ReservationSummaryComponent implements OnInit {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private reservationSvc = inject(ReservationService);
	private hotelSvc = inject(HotelsService);
	private typeSvc = inject(RoomTypeService);
	private roomSvc = inject(RoomService);
	private usersSvc = inject(UsersService);

	// Datos de la reserva
	reservationId: number | null = null;
	reservationCode = '';
	reservation: Reservation | null = null;

	// Datos del usuario
	currentUser: User | null = null;
	userName = '';
	userDocument = '';
	userEmail = '';
	userPhone = '';

	// Datos para mostrar
	hotelName = '';
	hotelLatitude = '';
	hotelLongitude = '';
	roomTypeName = '';
	roomNumber = '';
	roomTheme = '';
	capacity: number | null = null;
	basePrice: number | null = null;

	checkIn = '';
	checkOut = '';
	nights = 0;

	subtotal: number | null = null;
	taxes: number | null = null;
	taxPercentage = 0.19;
	total: number | null = null;

	// Estados
	isLoading = true;
	loadError = '';

	ngOnInit() {
		if (this.isBrowser()) {
			window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
		}

		this.reservationId = Number(this.route.snapshot.queryParamMap.get('reservationId'));

		if (!this.reservationId) {
			this.loadError = 'No se encontró el ID de la reserva.';
			this.isLoading = false;
			return;
		}

		this.reservationCode = this.buildReservationCode(this.reservationId);

		this.loadUserData();

		this.loadReservationData();
	}

	private loadUserData(): void {
		this.usersSvc.getMe().subscribe({
			next: (user: User) => {
				this.currentUser = user;
				this.userName = user.full_name || '';
				this.userDocument = user.national_id || '';
				this.userEmail = user.email || '';
				this.userPhone = user.phone || '';
			},
			error: (err) => {
				console.error('Error loading user data:', err);
			}
		});
	}

	private loadReservationData(): void {
		this.reservationSvc.getAll().subscribe({
			next: (reservations: Reservation[]) => {
				this.reservation = reservations.find(r =>
					r.reservation_id === this.reservationId
				) || null;

				if (!this.reservation) {
					this.loadError = 'No se encontró la reserva.';
					this.isLoading = false;
					return;
				}

				// Extraer datos de la reserva
				this.checkIn = this.reservation.check_in || '';
				this.checkOut = this.reservation.check_out || '';
				this.nights = this.calcNights(this.checkIn, this.checkOut);

				const hotelId = this.reservation.hotel_id;
				const roomId = this.reservation.room_id;

				const requests: any = {};
				if (hotelId) {
					requests.hotel = this.hotelSvc.get(hotelId);
				}
				if (roomId) {
					requests.room = (this.roomSvc as any).getById(roomId);
				}

				if (Object.keys(requests).length > 0) {
					forkJoin(requests).subscribe({
						next: (results: any) => {
							const hotel = results.hotel;
							const room = results.room;

							// Hotel
							if (hotel) {
								this.hotelName = hotel.name ?? '';
								this.hotelLatitude = hotel.latitude ?? '';
								this.hotelLongitude = hotel.longitude ?? '';
							}

							// Room
							if (room) {
								this.roomNumber = room.number ?? '';
								this.roomTheme = room.theme_name ?? '';

								const roomTypeId = room.room_type_id ?? '';

								// Room Type
								if (roomTypeId) {
									this.typeSvc.getById(roomTypeId).subscribe((rt: any) => {
										this.roomTypeName = rt?.name ?? '';
										this.capacity = Number(rt?.capacity ?? null);
										const base = Number(rt?.base_price ?? rt?.basePrice);
										this.basePrice = Number.isFinite(base) ? base : null;

										this.calculatePrices();
										this.isLoading = false;
									});
								} else {
									this.isLoading = false;
								}
							} else {
								this.isLoading = false;
							}
						},
						error: (err) => {
							console.error('Error loading reservation details:', err);
							this.loadError = 'Error al cargar los detalles de la reserva.';
							this.isLoading = false;
						}
					});
				} else {
					this.isLoading = false;
				}
			},
			error: (err) => {
				console.error('Error loading reservation:', err);
				this.loadError = 'Error al cargar la reserva.';
				this.isLoading = false;
			}
		});
	}

	private calculatePrices(): void {
		if (this.basePrice != null && this.nights > 0) {
			this.subtotal = this.basePrice * this.nights;
			this.taxes = this.subtotal * this.taxPercentage;
			this.total = this.subtotal + this.taxes;
		} else {
			this.subtotal = this.basePrice;
			this.taxes = null;
			this.total = this.basePrice;
		}
	}

	private calcNights(checkIn: string, checkOut: string): number {
		if (!checkIn || !checkOut) return 0;
		const start = new Date(checkIn);
		const end = new Date(checkOut);
		return Math.max(0, Math.round((+end - +start) / 86400000));
	}

	private buildReservationCode(id: number): string {
		return `RS-${String(id).padStart(6, '0')}`;
	}

	formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('es-ES', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}

	formatTime(dateStr: string, time: string = '15:00'): string {
		return time;
	}

	continuarReserva(): void {
		// Aquí puedes redirigir a una página de pago o confirmación
		console.log('Continuar con la reserva:', this.reservationId);
		// Por ejemplo: this.router.navigate(['/payment'], { queryParams: { reservationId: this.reservationId } });
	}

	goHome(): void {
		this.router.navigateByUrl('/');
	}

	private isBrowser(): boolean {
		return typeof window !== 'undefined';
	}

	formatCurrency(amount: number | null): string {
		if (amount == null) return '$ 0 COP';
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount).replace('COP', '').trim() + ' COP';
	}
}
