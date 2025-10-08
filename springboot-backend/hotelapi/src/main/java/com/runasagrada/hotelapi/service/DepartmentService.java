package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.Department;

import java.util.List;

public interface DepartmentService {
	List<Department> findAll();

	Department findById(Long id);

	Department create(Department department);

	Department update(Long id, Department partial);

	void delete(Long id);

	List<Department> findByHotelId(Long hotelId);

}