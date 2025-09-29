package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
	boolean existsByName(String name);

	List<Department> findByHotelId(Long hotelId);
}