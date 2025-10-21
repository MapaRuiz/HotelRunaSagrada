import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ReservationService as ReservationServiceModel,
  res_service_status,
} from '../model/reservation-service';

// Backend uses snake_case fields
export interface ReservationServiceRequest {
  reservation_id: number; // required
  service_id: number; // required
  schedule_id?: number | null;
  qty: number; // required
  unit_price: number; // required
  status?: res_service_status;
}

@Injectable({ providedIn: 'root' })
export class ReservationServiceApi {
  private http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/reservservice`;

  // GET /api/reservservice
  list(): Observable<ReservationServiceModel[]> {
    return this.http.get<ReservationServiceModel[]>(this.resource);
  }

  // GET /api/reservservice/reservation/{id}
  listByReservation(id: number): Observable<ReservationServiceModel[]> {
    return this.http.get<ReservationServiceModel[]>(`${this.resource}/reservation/${id}`);
  }

  // GET /api/reservservice/{id}
  get(id: number): Observable<ReservationServiceModel> {
    return this.http.get<ReservationServiceModel>(`${this.resource}/${id}`);
  }

  // POST /api/reservservice/add
  add(body: ReservationServiceRequest): Observable<ReservationServiceModel> {
    return this.http.post<ReservationServiceModel>(`${this.resource}/add`, body);
  }

  // PUT /api/reservservice/update/{id}
  update(
    id: number,
    body: Partial<ReservationServiceRequest>
  ): Observable<ReservationServiceModel> {
    return this.http.put<ReservationServiceModel>(`${this.resource}/update/${id}`, body);
  }

  // DELETE /api/reservservice/delete/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/delete/${id}`);
  }

  // Helper: build request from app model (snake_case -> camelCase)
  static toRequest(model: Partial<ReservationServiceModel>): Partial<ReservationServiceRequest> {
    return {
      reservation_id: model.reservation_id ?? (model.reservation as any)?.reservation_id,
      service_id: model.service_id ?? (model.service as any)?.id,
      schedule_id: model.schedule_id ?? (model.schedule as any)?.id,
      qty: model.qty,
      unit_price: model.unit_price,
      status: model.status as res_service_status | undefined,
    } as Partial<ReservationServiceRequest>;
  }
}

// Backward-compatible alias if other code imports `{ ReservationService }` from this path
export { ReservationServiceApi as ReservationService };
