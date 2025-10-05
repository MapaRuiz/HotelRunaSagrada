import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Hotel } from '../model/hotel';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HotelsService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  list() { return this.http.get<Hotel[]>(`${this.base}/hotels`); }
  get(id: number) { return this.http.get<Hotel>(`${this.base}/hotels/${id}`); }
  getOnlyIdName(): Observable<Record<number, string>> {
    return this.http.get<Record<number, string>>(`${this.base}/id-name`);
  }
  // amenityIds: null -> no tocar; [] -> limpiar; [ids] -> reemplazar (como en el back)
  create(body: Partial<Hotel> & { amenityIds?: number[] | null }) {
    return this.http.post<Hotel>(`${this.base}/hotels`, body);
  }
  update(id: number, body: Partial<Hotel> & { amenityIds?: number[] | null }) {
    return this.http.put<Hotel>(`${this.base}/hotels/${id}`, body);
  }
  delete(id: number) { return this.http.delete<void>(`${this.base}/hotels/${id}`); }
}
