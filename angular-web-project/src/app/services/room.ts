import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Room } from '../model/room';

export interface RoomRequest {
  hotel_id: number;
  room_type_id: number;
  number: string;
  floor: number;
  res_status?: Room['res_status'];
  cle_status?: Room['cle_status'];
  theme_name?: string;
  images?: string[];
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly resource = `${environment.apiBaseUrl}/rooms`;

  constructor(private http: HttpClient) {}

  list(params?: { hotelId?: number; roomTypeId?: number }): Observable<Room[]> {
    let p = new HttpParams();
    if (params?.hotelId != null) p = p.set('hotelId', params.hotelId);
    if (params?.roomTypeId != null) p = p.set('roomTypeId', params.roomTypeId);
    return this.http.get<Room[]>(this.resource, { params: p });
  }

  getById(id: number): Observable<Room> {
    return this.http.get<Room>(`${this.resource}/${id}`);
  }

  create(payload: RoomRequest): Observable<Room> {
    return this.http.post<Room>(this.resource, payload);
  }

  update(id: number, payload: RoomRequest): Observable<Room> {
    return this.http.put<Room>(`${this.resource}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
