import { Reservation } from "./reservation";
import { ServiceOffering } from "./service-offering";
import { ServiceRating } from "./service-rating";
import { ServiceSchedule } from "./service-schedule";
import { Task } from "./task";

export type res_service_status = 'ORDERED' | 'DELIVERED' | 'CANCELED' | string;

export interface ReservationService {
  res_service_id: number;
  reservation_id: number;
  service_id: number;
  schedule_id?: number | null;
  qty: number;
  unit_price: number;
  status: res_service_status;
  // Rel
  reservation?: Reservation;
  service?: ServiceOffering;
  schedule?: ServiceSchedule | null;
  rating?: ServiceRating | null; 
  tasks?: Task[];
}