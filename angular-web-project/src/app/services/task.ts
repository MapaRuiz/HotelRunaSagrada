import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Task } from '../model/task';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  list() { return this.http.get<Task[]>(`${this.base}/task`); }
  get(id: number) { return this.http.get<Task>(`${this.base}/task/${id}`); }
  create(body: Partial<Task>) { return this.http.post<Task>(`${this.base}/task`, body); }
  update(id: number, body: Partial<Task>) { return this.http.put<Task>(`${this.base}/task/${id}`, body); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/task/${id}`); }
  
  getByStaffMember(staffId: number) { return this.http.get<Task[]>(`${this.base}/task/staff/${staffId}`); }
  getByRoom(roomId: number) { return this.http.get<Task[]>(`${this.base}/task/room/${roomId}`)}
  getByStatus(status: string) { return this.http.get<Task[]>(`${this.base}/task/status/${status}`); }
  getByType(type: number) { return this.http.get<Task[]>(`${this.base}/task/type/${type}`)}
  getByStaffAndStatus(staffId: number, status: string) { return this.http.get<Task[]>(`${this.base}/task/staff/${staffId}/status/${status}`)}
}
