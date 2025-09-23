import { Reservation } from "./reservation";
import { ReservationService } from "./reservation-service";
import { ServiceOffering } from "./service-offering";

export interface ServiceSchedule {
    id: number;
    days_of_week: string[];
    start_time: string;
    end_time: string;
    active: boolean;
    //Rel
    service_offering?: ServiceOffering;
    reservation_services?: ReservationService[];
}