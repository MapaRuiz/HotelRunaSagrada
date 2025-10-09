import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Department } from '../model/department';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  list() { return this.http.get<Department[]>(`${this.base}/departments`); }
  get(id: number) { return this.http.get<Department>(`${this.base}/departments/${id}`); }
  create(body: Partial<Department>) { return this.http.post<Department>(`${this.base}/departments`, body); }
  update(id: number, body: Partial<Department>) { return this.http.put<Department>(`${this.base}/departments/${id}`, body); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/departments/${id}`); }
  
  getByHotel(hotelId: number) { return this.http.get<Department[]>(`${this.base}/departments/hotel/${hotelId}`); }
}
