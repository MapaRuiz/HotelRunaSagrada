import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReservationService as ReservationServiceModel, res_service_status } from '../model/reservation-service';

// Matches ReservationServiceController.ReservationServiceRequest (camelCase payload)
export interface ReservationServiceRequest {
  reservationId: number;    // required
  serviceId: number;        // required
  scheduleId?: number | null;
  qty: number;              // required
  unitPrice: number;        // required
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

  // GET /api/reservservice/{id}
  get(id: number): Observable<ReservationServiceModel> {
    return this.http.get<ReservationServiceModel>(`${this.resource}/${id}`);
  }

  // POST /api/reservservice/add
  add(body: ReservationServiceRequest): Observable<ReservationServiceModel> {
    return this.http.post<ReservationServiceModel>(`${this.resource}/add`, body);
  }

  // PUT /api/reservservice/update/{id}
  update(id: number, body: Partial<ReservationServiceRequest>): Observable<ReservationServiceModel> {
    return this.http.put<ReservationServiceModel>(`${this.resource}/update/${id}`, body);
  }

  // DELETE /api/reservservice/delete/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/delete/${id}`);
  }

  // Helper: build request from app model (snake_case -> camelCase)
  static toRequest(model: Partial<ReservationServiceModel>): Partial<ReservationServiceRequest> {
    return {
      reservationId: model.reservation_id ?? (model.reservation as any)?.reservation_id,
      serviceId: model.service_id ?? (model.service as any)?.id,
      scheduleId: model.schedule_id ?? (model.schedule as any)?.id,
      qty: model.qty,
      unitPrice: model.unit_price,
      status: model.status as res_service_status | undefined,
    } as Partial<ReservationServiceRequest>;
  }
}

// Backward-compatible alias if other code imports `{ ReservationService }` from this path
export { ReservationServiceApi as ReservationService };

