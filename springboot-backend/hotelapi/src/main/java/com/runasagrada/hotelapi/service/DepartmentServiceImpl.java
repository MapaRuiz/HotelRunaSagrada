package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Department;
import com.runasagrada.hotelapi.repository.DepartmentRepository;
import com.runasagrada.hotelapi.repository.HotelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

	@Autowired
	private DepartmentRepository departments;

	@Autowired
	private HotelRepository hotels;

	@Autowired
	private ServiceHelper helper;

	@Override
	@Transactional(readOnly = true)
	public List<Department> findAll() {
		return departments.findAll(Sort.by(Sort.Direction.ASC, "departmentId"));
	}

	@Override
	@Transactional(readOnly = true)
	public Department findById(Long id) {
		return departments.findById(id).orElseThrow(() -> new NoSuchElementException("Department not found"));
	}

	@Override
	public Department create(Department department) {
		validate(department);
		if (department.getDepartmentId() != null)
			department.setDepartmentId(null);
		helper.resyncIdentity("departments", "department_id");
		return departments.save(department);
	}

	@Override
	public Department update(Long id, Department partial) {
		Department db = findById(id);

		if (partial.getHotelId() != null)
			db.setHotelId(partial.getHotelId());
		if (partial.getName() != null && !partial.getName().isBlank())
			db.setName(partial.getName());

		validate(db);
		return departments.save(db);
	}

	@Override
	public void delete(Long id) {
		Department db = findById(id);
		departments.delete(db);
		helper.resyncIdentity("departments", "department_id");
	}

	@Override
	@Transactional(readOnly = true)
	public List<Department> findByHotelId(Long hotelId) {
		return departments.findByHotelId(hotelId);
	}

	private void validate(Department department) {
		if (department.getName() == null || department.getName().isBlank())
			throw new IllegalArgumentException("Department name is required");
		if (department.getHotelId() == null)
			throw new IllegalArgumentException("Hotel ID is required");

		// Verificar que el hotel existe
		if (!hotels.existsById(department.getHotelId()))
			throw new NoSuchElementException("Hotel not found with id: " + department.getHotelId());
	}
}