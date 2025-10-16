// src/app/services/reservation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reservation } from '../model/reservation';

type ReservationRequest = {
  userId: number;
  hotelId: number;
  roomId: number;
  checkIn: string;   // 'yyyy-MM-dd'
  checkOut: string;  // 'yyyy-MM-dd'
};

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly resource = `${environment.apiBaseUrl}/reservations`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(this.resource);
  }

  getById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.resource}/${id}`);
  }

  create(draft: Partial<Reservation>) {
    const body = {
      userId: Number(draft.user_id!),
      hotelId: Number(draft.hotel_id!),
      roomId: Number(draft.room_id!),
      checkIn: draft.check_in!,
      checkOut: draft.check_out!,
      status: draft.status!        // <<<<<<<<<<<<<<
    };
    return this.http.post<Reservation>(this.resource, body);
  }

  update(id: number, draft: Partial<Reservation>) {
    const body = {
      userId: Number(draft.user_id!),   // opcional para back (lo ignoras si quieres)
      hotelId: Number(draft.hotel_id!),
      roomId: Number(draft.room_id!),
      checkIn: draft.check_in!,
      checkOut: draft.check_out!,
      status: draft.status!             // <<<<<<<<<<<<<<
    };
    return this.http.put<Reservation>(`${this.resource}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }

  getToday(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.resource}/today`);
  }
}
