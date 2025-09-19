import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Amenity } from '../model/amenity';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AmenitiesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl; // ej: http://localhost:8080/api

  list()   { return this.http.get<Amenity[]>(`${this.base}/amenities`); }
  create(body: Partial<Amenity>) { return this.http.post<Amenity>(`${this.base}/amenities`, body); }
  update(id: number, body: Partial<Amenity>) { return this.http.put<Amenity>(`${this.base}/amenities/${id}`, body); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/amenities/${id}`); }
}
