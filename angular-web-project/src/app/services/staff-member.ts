import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { StaffMember } from '../model/staff-member';

@Injectable({ providedIn: 'root' })
export class StaffMemberService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  list() { return this.http.get<StaffMember[]>(`${this.base}/staff-members`); }
  get(id: number) { return this.http.get<StaffMember>(`${this.base}/staff-members/${id}`); }
  create(body: Partial<StaffMember>) { return this.http.post<StaffMember>(`${this.base}/staff-members`, body); }
  update(id: number, body: Partial<StaffMember>) { return this.http.put<StaffMember>(`${this.base}/staff-members/${id}`, body); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/staff-members/${id}`); }
  
  getByHotel(hotelId: number) { return this.http.get<StaffMember[]>(`${this.base}/staff-members/hotel/${hotelId}`); }
  getByDepartment(departmentId: number) { return this.http.get<StaffMember[]>(`${this.base}/staff-members/department/${departmentId}`); }
  
  getStaffWithUsersByDepartment(departmentId: number) { 
    return this.http.get<StaffMember[]>(`${this.base}/staff-members/department/${departmentId}?includeUser=true`); 
  }
}
