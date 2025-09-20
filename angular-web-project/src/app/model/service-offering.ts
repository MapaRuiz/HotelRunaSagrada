import { Hotel } from "./hotel";
import { ServiceSchedule } from "./service-schedule";

export interface ServiceOffering {
    service_offering_id: number;
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
    schedules?: ServiceSchedule[];
    hotel: Hotel;
}