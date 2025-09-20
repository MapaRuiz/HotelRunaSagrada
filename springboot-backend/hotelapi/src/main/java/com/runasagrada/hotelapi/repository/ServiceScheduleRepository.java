package com.runasagrada.hotelapi.repository;

import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.runasagrada.hotelapi.model.ServiceOffering;
import com.runasagrada.hotelapi.model.ServiceSchedule;
import com.runasagrada.hotelapi.model.ServiceSchedule.DayWeek;

@Repository
public interface ServiceScheduleRepository extends JpaRepository<ServiceSchedule, Long> {
    List<ServiceSchedule> findByService(ServiceOffering service);

    List<ServiceSchedule> findByDaysOfWeekContaining(DayWeek dayOfWeek);

    List<ServiceSchedule> findByStartTime(LocalTime startTime);
}
