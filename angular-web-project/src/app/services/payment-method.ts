import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentMethod } from '../model/payment-method';

export interface PaymentMethodRequest {
	
	user_id: number;
	type: 'TARJETA' | 'PAYPAL' | 'EFECTIVO';
	last4?: string;
	holder_name?: string;
	billing_address?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
	private readonly resource = `${environment.apiBaseUrl}/payment-methods`;

	constructor(private http: HttpClient) { }

	getAll(): Observable<PaymentMethod[]> {
		return this.http.get<PaymentMethod[]>(this.resource);
	}

	getById(id: number): Observable<PaymentMethod> {
		return this.http.get<PaymentMethod>(`${this.resource}/${id}`);
	}

	getMy(userId: number): Observable<PaymentMethod[]> {
		return this.http.get<PaymentMethod[]>(`${this.resource}/user/${userId}`);
	}

	create(payload: PaymentMethodRequest): Observable<PaymentMethod> {
		return this.http.post<PaymentMethod>(this.resource, payload);
	}

	update(id: number, payload: Partial<PaymentMethodRequest>): Observable<PaymentMethod> {
		return this.http.put<PaymentMethod>(`${this.resource}/${id}`, payload);
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(`${this.resource}/${id}`);
	}
}
