import { ServiceOffering } from "./service-offering";

export interface ServiceSchedule {
    id: number;
    days_of_week: string[];
    start_time: string;
    end_time: string;
    active: boolean;
    service_offering?: ServiceOffering;
}