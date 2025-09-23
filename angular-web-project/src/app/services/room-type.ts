import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RoomType } from '../model/room-type';

export interface RoomTypeRequest {
  name: string;
  capacity: number;
  base_price: number;
  description?: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class RoomTypeService {
  private readonly resource = `${environment.apiBaseUrl}/room-types`;

  constructor(private http: HttpClient) {}

  list(): Observable<RoomType[]> {
    return this.http.get<RoomType[]>(this.resource);
  }

  getById(id: number): Observable<RoomType> {
    return this.http.get<RoomType>(`${this.resource}/${id}`);
  }

  create(payload: RoomTypeRequest): Observable<RoomType> {
    return this.http.post<RoomType>(this.resource, payload);
  }

  update(id: number, payload: RoomTypeRequest): Observable<RoomType> {
    return this.http.put<RoomType>(`${this.resource}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}`);
  }
}
