package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Task;
import com.runasagrada.hotelapi.model.Task.TaskStatus;
import com.runasagrada.hotelapi.model.Task.TaskType;

import java.util.List;

public interface TaskService {
	List<Task> findAll();

	Task findById(Long id);

	Task create(Task task);

	Task update(Long id, Task partial);

	void delete(Long id);

	List<Task> findByStaffId(Long staffId);

	List<Task> findByRoomId(Integer roomId);

	List<Task> findByStatus(TaskStatus status);

	List<Task> findByType(TaskType type);

	List<Task> findByStaffIdAndStatus(Long staffId, TaskStatus status);
}