package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Task;
import com.runasagrada.hotelapi.model.Task.TaskStatus;
import com.runasagrada.hotelapi.model.Task.TaskType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
	List<Task> findByStaffId(Long staffId);

	List<Task> findByRoomId(Integer roomId);

	List<Task> findByStatus(TaskStatus status);

	List<Task> findByType(TaskType type);

	List<Task> findByStaffIdAndStatus(Long staffId, TaskStatus status);
	
	void deleteByRoomId(Integer roomId);
	
	void deleteByStaffId(Long staffId);

}
