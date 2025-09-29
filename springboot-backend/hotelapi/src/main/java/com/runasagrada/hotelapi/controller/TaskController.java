package com.runasagrada.hotelapi.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.runasagrada.hotelapi.model.Task;
import com.runasagrada.hotelapi.model.Task.TaskStatus;
import com.runasagrada.hotelapi.model.Task.TaskType;
import com.runasagrada.hotelapi.service.TaskService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class TaskController {

	@Autowired
	private TaskService service;

	@GetMapping("/tasks")
	public List<Task> list() {
		return service.findAll();
	}

	@GetMapping("/tasks/{id}")
	public Task get(@PathVariable Long id) {
		return service.findById(id);
	}

	@GetMapping("/tasks/staff/{staffId}")
	public List<Task> getByStaff(@PathVariable Long staffId) {
		return service.findByStaffId(staffId);
	}

	@GetMapping("/tasks/room/{roomId}")
	public List<Task> getByRoom(@PathVariable Integer roomId) {
		return service.findByRoomId(roomId);
	}

	@GetMapping("/tasks/status/{status}")
	public List<Task> getByStatus(@PathVariable TaskStatus status) {
		return service.findByStatus(status);
	}

	@GetMapping("/tasks/type/{type}")
	public List<Task> getByType(@PathVariable TaskType type) {
		return service.findByType(type);
	}

	@GetMapping("/tasks/staff/{staffId}/status/{status}")
	public List<Task> getByStaffAndStatus(@PathVariable Long staffId, @PathVariable TaskStatus status) {
		return service.findByStaffIdAndStatus(staffId, status);
	}

	@GetMapping("/tasks/staff/{staffId}/recent")
	public List<Task> getByStaffOrderByDate(@PathVariable Long staffId) {
		return service.findByStaffIdOrderByCreatedAtDesc(staffId);
	}

	@GetMapping("/tasks/status/{status}/ordered")
	public List<Task> getByStatusOrderByDate(@PathVariable TaskStatus status) {
		return service.findByStatusOrderByCreatedAtAsc(status);
	}

	@PostMapping("/tasks")
	public ResponseEntity<Task> create(@RequestBody TaskRequest body) {
		Task task = new Task();
		task.setStaffId(body.getStaffId());
		task.setRoomId(body.getRoomId());
		task.setResServiceId(body.getResServiceId());
		task.setType(body.getType());
		task.setStatus(body.getStatus() != null ? body.getStatus() : TaskStatus.PENDING);
		return ResponseEntity.ok(service.create(task));
	}

	@PutMapping("/tasks/{id}")
	public ResponseEntity<Task> update(@PathVariable Long id, @RequestBody TaskRequest body) {
		Task partial = new Task();
		partial.setStaffId(body.getStaffId());
		partial.setRoomId(body.getRoomId());
		partial.setResServiceId(body.getResServiceId());
		partial.setType(body.getType());
		partial.setStatus(body.getStatus());
		return ResponseEntity.ok(service.update(id, partial));
	}

	@PutMapping("/tasks/{id}/status")
	public ResponseEntity<Task> updateStatus(@PathVariable Long id, @RequestBody TaskStatusRequest body) {
		Task partial = new Task();
		partial.setStatus(body.getStatus());
		return ResponseEntity.ok(service.update(id, partial));
	}

	@DeleteMapping("/tasks/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	@Data
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public static class TaskRequest {
		private Long staffId;
		private Integer roomId;
		private Long resServiceId;
		private TaskType type;
		private TaskStatus status;
	}

	@Data
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public static class TaskStatusRequest {
		private TaskStatus status;
	}
}