package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Task;
import com.runasagrada.hotelapi.model.Task.TaskStatus;
import com.runasagrada.hotelapi.model.Task.TaskType;
import com.runasagrada.hotelapi.repository.TaskRepository;
import com.runasagrada.hotelapi.repository.StaffMemberRepository;
import com.runasagrada.hotelapi.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class TaskServiceImpl implements TaskService {

	@Autowired
	private TaskRepository tasks;

	@Autowired
	private StaffMemberRepository staffMembers;

	@Autowired
	private RoomRepository rooms;

	@Autowired
	private ServiceHelper helper;

	@Override
	@Transactional(readOnly = true)
	public List<Task> findAll() {
		return tasks.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
	}

	@Override
	@Transactional(readOnly = true)
	public Task findById(Long id) {
		return tasks.findById(id).orElseThrow(() -> new NoSuchElementException("Task not found"));
	}

	@Override
	public Task create(Task task) {
		validate(task);
		if (task.getTaskId() != null)
			task.setTaskId(null);
		helper.resyncIdentity("tasks", "task_id");
		return tasks.save(task);
	}

	@Override
	public Task update(Long id, Task partial) {
		Task db = findById(id);

		if (partial.getStaffId() != null)
			db.setStaffId(partial.getStaffId());
		if (partial.getRoomId() != null)
			db.setRoomId(partial.getRoomId());
		if (partial.getResServiceId() != null)
			db.setResServiceId(partial.getResServiceId());
		if (partial.getType() != null)
			db.setType(partial.getType());
		if (partial.getStatus() != null)
			db.setStatus(partial.getStatus());

		validate(db);
		return tasks.save(db);
	}

	@Override
	public void delete(Long id) {
		Task db = findById(id);
		tasks.delete(db);
		helper.resyncIdentity("tasks", "task_id");
	}

	@Override
	@Transactional(readOnly = true)
	public List<Task> findByStaffId(Long staffId) {
		return tasks.findByStaffId(staffId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Task> findByRoomId(Integer roomId) {
		return tasks.findByRoomId(roomId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Task> findByStatus(TaskStatus status) {
		return tasks.findByStatus(status);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Task> findByType(TaskType type) {
		return tasks.findByType(type);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Task> findByStaffIdAndStatus(Long staffId, TaskStatus status) {
		return tasks.findByStaffIdAndStatus(staffId, status);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Task> findByStaffIdOrderByCreatedAtDesc(Long staffId) {
		return tasks.findByStaffIdOrderByCreatedAtDesc(staffId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Task> findByStatusOrderByCreatedAtAsc(TaskStatus status) {
		return tasks.findByStatusOrderByCreatedAtAsc(status);
	}

	private void validate(Task task) {
		if (task.getStaffId() == null)
			throw new IllegalArgumentException("Staff ID is required");
		if (task.getType() == null)
			throw new IllegalArgumentException("Task type is required");
		if (task.getStatus() == null)
			throw new IllegalArgumentException("Task status is required");

		// Verificar que el staff member existe
		if (!staffMembers.existsById(task.getStaffId()))
			throw new NoSuchElementException("StaffMember not found with id: " + task.getStaffId());

		// Verificar que el room existe
		if (task.getRoomId() != null && !rooms.existsById(task.getRoomId()))
			throw new NoSuchElementException("Room not found with id: " + task.getRoomId());
	}
}