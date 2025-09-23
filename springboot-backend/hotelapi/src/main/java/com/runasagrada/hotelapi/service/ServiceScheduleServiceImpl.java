package com.runasagrada.hotelapi.service;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.runasagrada.hotelapi.model.ServiceOffering;
import com.runasagrada.hotelapi.model.ServiceSchedule;
import com.runasagrada.hotelapi.repository.ServiceScheduleRepository;
import com.runasagrada.hotelapi.model.ServiceSchedule.DayWeek;

@Service
public class ServiceScheduleServiceImpl implements ServiceScheduleService {

    @Autowired
    private ServiceScheduleRepository serviceScheduleRepository;

    @Override
    public List<ServiceSchedule> findByService(ServiceOffering service) {
        return serviceScheduleRepository.findByService(service);
    }

    @Override
    public List<ServiceSchedule> findByDayOfWeek(DayWeek dayOfWeek) {
        return serviceScheduleRepository.findByDaysOfWeekContaining(dayOfWeek);
    }

    @Override
    public List<ServiceSchedule> findByStartTime(LocalTime startTime) {
        return serviceScheduleRepository.findByStartTime(startTime);
    }

    @Override
    public void save(ServiceSchedule serviceSchedule) {
        serviceScheduleRepository.save(serviceSchedule);
    }

    @Override
    public void delete(Long id) {
        serviceScheduleRepository.deleteById(id);
    }

    @Override
    public Optional<ServiceSchedule> findById(Long id) {
        return serviceScheduleRepository.findById(id);
    }

    @Override
    public void seedSchedules(ServiceSchedule schedule, int days) {
        serviceScheduleRepository.save(schedule);
    }
}
