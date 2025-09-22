import { Hotel } from "./hotel";
import { ReservationService } from "./reservation-service";
import { ServiceSchedule } from "./service-schedule";

export interface ServiceOffering {
    id: number;
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

    //Rel
    hotel?: Hotel;
    schedules?: ServiceSchedule[];
    reservation_services?: ReservationService[];
}