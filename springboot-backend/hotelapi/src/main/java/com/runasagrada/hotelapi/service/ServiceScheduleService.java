package com.runasagrada.hotelapi.service;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import com.runasagrada.hotelapi.model.ServiceOffering;
import com.runasagrada.hotelapi.model.ServiceSchedule;
import com.runasagrada.hotelapi.model.ServiceSchedule.DayWeek;

public interface ServiceScheduleService {
    List<ServiceSchedule> findByService(ServiceOffering service);

    List<ServiceSchedule> findByDayOfWeek(DayWeek dayOfWeek);

    List<ServiceSchedule> findByStartTime(LocalTime startTime);

    void save(ServiceSchedule serviceSchedule);

    void delete(Long id);

    Optional<ServiceSchedule> findById(Long id);
}
