package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Task;
import com.runasagrada.hotelapi.model.Task.TaskStatus;
import com.runasagrada.hotelapi.model.Task.TaskType;
import com.runasagrada.hotelapi.repository.TaskRepository;
import com.runasagrada.hotelapi.repository.StaffMemberRepository;
import com.runasagrada.hotelapi.repository.RoomRepository;
import com.runasagrada.hotelapi.repository.ReservationServiceRepository;
import com.runasagrada.hotelapi.model.ReservationServiceEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.runasagrada.hotelapi.model.StaffMember;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.NoSuchElementException;
import java.util.Objects;

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
	private ReservationServiceRepository reservationServices;

	@Autowired
	private ServiceHelper helper;

	private static final Set<Long> FORBIDDEN_STAFF_IDS = Set.of(1L, 2L, 3L, 4L, 5L);

	private List<StaffMember> filterAllowed(List<StaffMember> list) {
		if (list == null)
			return List.of();
		return list.stream()
				.filter(Objects::nonNull)
				.filter(s -> s.getStaffId() != null && !FORBIDDEN_STAFF_IDS.contains(s.getStaffId()))
				.collect(Collectors.toList());
	}

	private List<StaffMember> pickCandidatesByType(Task.TaskType type) {
		List<StaffMember> base = null;
		if (type == Task.TaskType.TO_DO) {
			base = staffMembers.findByDepartmentNames(List.of("limpieza", "mantenimiento"));
		} else if (type == Task.TaskType.GUIDING) {
			base = staffMembers.findByDepartmentNames(List.of("recepción", "servicio al cliente",
					"servicio_cliente", "servicioalcliente"));
		} else if (type == Task.TaskType.DELIVERY) {
			base = staffMembers.findByDepartmentNames(List.of("cocina"));
		}

		// Primero intentamos con candidatos del departamento, excluyendo prohibidos:
		List<StaffMember> allowed = filterAllowed(base);

		// Si quedó vacío, fallback a cualquier operador permitido:
		if (allowed.isEmpty()) {
			allowed = filterAllowed(staffMembers.findByUserRole("OPERATOR"));
		}

		return allowed;
	}

	private Long chooseAllowedAssignee(Task.TaskType type) {
		List<StaffMember> allowed = pickCandidatesByType(type);
		if (allowed.isEmpty())
			return null;
		int idx = (int) (Math.random() * allowed.size());
		return allowed.get(idx).getStaffId();
	}

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
	public Task create(Task task, Long resServiceId) {
		if (resServiceId != null) {
			ReservationServiceEntity reservationService = reservationServices.findById(resServiceId)
					.orElseThrow(
							() -> new NoSuchElementException("ReservationService not found with id: " + resServiceId));
			task.setReservationService(reservationService);
		}

		// === CAMBIO: reasignación si viene prohibido, o autoasignación excluyendo 1-5
		// ===
		if (task.getStaffId() == null || FORBIDDEN_STAFF_IDS.contains(task.getStaffId())) {
			Long chosen = chooseAllowedAssignee(task.getType());
			if (chosen != null) {
				task.setStaffId(chosen);
			} else {
				// Si no hay nadie permitido, último fallback: cualquier staff que no sea
				// prohibido
				List<StaffMember> anyone = filterAllowed(staffMembers.findAll());
				if (!anyone.isEmpty()) {
					int idx = (int) (Math.random() * anyone.size());
					task.setStaffId(anyone.get(idx).getStaffId());
				} else {
					// Si realmente no hay nadie, lanzamos error explícito
					throw new NoSuchElementException("No hay StaffMembers válidos para asignar (IDs 1-5 vetados).");
				}
			}
		}

		validate(task);
		if (task.getTaskId() != null)
			task.setTaskId(null);
		helper.resyncIdentity("tasks", "task_id");
		return tasks.save(task);
	}

	@Override
	public Task update(Long id, Task partial, Long resServiceId) {
		Task db = findById(id);

		// === CAMBIO: si llega staffId prohibido, reasignar a otro permitido ===
		if (partial.getStaffId() != null) {
			Long incoming = partial.getStaffId();
			if (FORBIDDEN_STAFF_IDS.contains(incoming)) {
				Long chosen = chooseAllowedAssignee(
						partial.getType() != null ? partial.getType() : db.getType());
				if (chosen == null) {
					List<StaffMember> anyone = filterAllowed(staffMembers.findAll());
					if (anyone.isEmpty()) {
						throw new NoSuchElementException("No hay StaffMembers válidos para asignar (IDs 1-5 vetados).");
					}
					int idx = (int) (Math.random() * anyone.size());
					db.setStaffId(anyone.get(idx).getStaffId());
				} else {
					db.setStaffId(chosen);
				}
			} else {
				db.setStaffId(incoming);
			}
		}

		if (partial.getRoomId() != null)
			db.setRoomId(partial.getRoomId());

		if (resServiceId != null) {
			ReservationServiceEntity reservationService = reservationServices.findById(resServiceId)
					.orElseThrow(
							() -> new NoSuchElementException("ReservationService not found with id: " + resServiceId));
			db.setReservationService(reservationService);
		} else if (resServiceId == null && partial.getReservationService() == null) {
			db.setReservationService(null);
		}

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

	private void validate(Task task) {
		if (task.getStaffId() == null)
			throw new IllegalArgumentException("Staff ID is required");
		if (task.getType() == null)
			throw new IllegalArgumentException("Task type is required");
		if (task.getStatus() == null)
			throw new IllegalArgumentException("Task status is required");

		if (!staffMembers.existsById(task.getStaffId()))
			throw new NoSuchElementException("StaffMember not found with id: " + task.getStaffId());

		if (task.getRoomId() != null && !rooms.existsById(task.getRoomId()))
			throw new NoSuchElementException("Room not found with id: " + task.getRoomId());

		if (task.getReservationService() != null && task.getReservationService().getId() != null) {
			if (!reservationServices.existsById(task.getReservationService().getId()))
				throw new NoSuchElementException(
						"ReservationService not found with id: " + task.getReservationService().getId());
		}
	}
}