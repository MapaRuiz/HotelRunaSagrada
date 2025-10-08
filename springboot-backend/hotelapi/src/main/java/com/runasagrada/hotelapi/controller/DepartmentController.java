package com.runasagrada.hotelapi.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.runasagrada.hotelapi.model.Department;
import com.runasagrada.hotelapi.service.DepartmentService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class DepartmentController {

	@Autowired
	private DepartmentService service;

	@GetMapping("/departments")
	public List<Department> list() {
		return service.findAll();
	}

	@GetMapping("/departments/{id}")
	public Department get(@PathVariable Long id) {
		return service.findById(id);
	}

	@GetMapping("/departments/hotel/{hotelId}")
	public List<Department> getByHotel(@PathVariable Long hotelId) {
		return service.findByHotelId(hotelId);
	}

	@PostMapping("/departments")
	public ResponseEntity<Department> create(@RequestBody DepartmentRequest body) {
		Department department = new Department();
		department.setHotelId(body.getHotelId());
		department.setName(body.getName());
		return ResponseEntity.ok(service.create(department));
	}

	@PutMapping("/departments/{id}")
	public ResponseEntity<Department> update(@PathVariable Long id, @RequestBody DepartmentRequest body) {
		Department partial = new Department();
		partial.setHotelId(body.getHotelId());
		partial.setName(body.getName());
		return ResponseEntity.ok(service.update(id, partial));
	}

	@DeleteMapping("/departments/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	@Data
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public static class DepartmentRequest {
		private Long hotelId;
		private String name;
	}
}