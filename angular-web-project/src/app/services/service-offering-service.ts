import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ServiceOffering } from '../model/service-offering';
import { ServiceSchedule } from '../model/service-schedule';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceOfferingService {
  private http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/servoffering`;

  getById(id: number): Observable<ServiceOffering> {
    return this.http.get<ServiceOffering>(`${this.resource}/${id}`);
  }

  getAll(): Observable<ServiceOffering[]> {
    return this.http.get<ServiceOffering[]>(`${this.resource}`);
  }

  create(payload: ServiceOfferingRequest): Observable<ServiceOffering> {
    return this.http.post<ServiceOffering>(`${this.resource}/add`, payload);
  }

  update(id: number, payload: ServiceOfferingRequest): Observable<ServiceOffering> {
    return this.http.put<ServiceOffering>(`${this.resource}/update/${id}`, payload);
  }

  createSchedule(serviceId: number, payload: ServiceScheduleRequest): Observable<ServiceSchedule> {
    return this.http.post<ServiceSchedule>(`${this.resource}/${serviceId}/schedules/add`, payload);
  }

  updateSchedule(scheduleId: number, payload: ServiceScheduleRequest): Observable<ServiceSchedule> {
    return this.http.put<ServiceSchedule>(`${this.resource}/schedules/update/${scheduleId}`, payload);
  }

  getDetail(id: number): Observable<ServiceOfferingDetailResponse> {
    return this.http.get<ServiceOfferingDetailResponse>(`${this.resource}/available/${id}`);
  }

  getGastronomy(): Observable<Record<string, ServiceOffering[]>> {
    return this.http.get<Record<string, ServiceOffering[]>>(`${this.resource}/gastronomy`);
  }

  getTours(): Observable<Record<string, ServiceOffering[]>> {
    return this.http.get<Record<string, ServiceOffering[]>>(`${this.resource}/tours`);
  }

  getAmenities(): Observable<Record<string, ServiceOffering[]>> {
    return this.http.get<Record<string, ServiceOffering[]>>(`${this.resource}/amenities`);
  }

  deleteById(id: number) {
    return this.http.delete<void>(`${this.resource}/delete/${id}`);
  }
}

export interface ServiceOfferingRequest {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  base_price: number;
  duration_minutes: number;
  image_urls: string[];
  max_participants: number;
  latitude: number;
  longitude: number;
  hotel_id: number;
}

export interface ServiceScheduleRequest {
  days_of_week: string[];
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface ServiceOfferingDetailResponse {
  service: ServiceOffering;
  schedules: ServiceSchedule[];
}
