package com.runasagrada.hotelapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.runasagrada.hotelapi.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
}
