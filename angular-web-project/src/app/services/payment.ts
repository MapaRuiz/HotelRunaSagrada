import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Payment } from '../model/payment';

export interface PaymentRequest {
	reservation_id: number;
	payment_method_id: number;
	amount: number;
	status?: 'PENDING' | 'PAID' | 'REFUNDED';
	tx_reference?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
	private readonly resource = `${environment.apiBaseUrl}/payments`;

	constructor(private http: HttpClient) { }

	getAll(): Observable<Payment[]> {
		return this.http.get<Payment[]>(this.resource);
	}

	getById(id: number): Observable<Payment> {
		return this.http.get<Payment>(`${this.resource}/${id}`);
	}

	getByReservation(reservationId: number): Observable<Payment[]> {
		return this.http.get<Payment[]>(`${this.resource}/reservation/${reservationId}`);
	}

	create(payload: PaymentRequest): Observable<Payment> {
		return this.http.post<Payment>(this.resource, payload);
	}

	update(id: number, payload: Partial<PaymentRequest>): Observable<Payment> {
		return this.http.put<Payment>(`${this.resource}/${id}`, payload);
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(`${this.resource}/${id}`);
	}

	calculateIncome(): Observable<[number, number]> {
		return this.http.get<[number, number]>(`${this.resource}/income`);
	}
}
