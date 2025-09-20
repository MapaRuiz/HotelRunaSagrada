export interface ServiceSchedule {
    service_schedule_id: number;
    days_of_week: string[];
    start_time: string;
    end_time: string;
    is_active: boolean;
}