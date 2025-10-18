package com.runasagrada.hotelapi.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.runasagrada.hotelapi.model.StaffMemberWithUserDto;
import com.runasagrada.hotelapi.model.StaffMember;
import com.runasagrada.hotelapi.service.StaffMemberService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class StaffMemberController {

	@Autowired
	private StaffMemberService service;

	@GetMapping("/staff-members")
	public List<StaffMember> list() {
		return service.findAll();
	}

	@GetMapping("/staff-members/{id}")
	public StaffMember get(@PathVariable Long id) {
		return service.findById(id);
	}

	@GetMapping("/staff-members/staff-info/{userId}")
	public StaffMember getByUserID(@PathVariable Long userId) {
		return service.findByUserId(userId);
	}

	@GetMapping("/staff-members/hotel/{hotelId}")
	public List<StaffMember> getByHotel(@PathVariable Long hotelId) {
		return service.findByHotelId(hotelId);
	}

	@GetMapping("/staff-members/department/{departmentId}")
	public ResponseEntity<?> getByDepartment(
			@PathVariable Long departmentId,
			@RequestParam(value = "includeUser", defaultValue = "false") boolean includeUser) {
		if (includeUser) {
			List<StaffMember> staffMembers = service.findByDepartmentIdWithUser(departmentId);
			List<StaffMemberWithUserDto> result = staffMembers.stream()
					.map(StaffMemberWithUserDto::fromStaffMember)
					.toList();
			return ResponseEntity.ok(result);
		}
		return ResponseEntity.ok(service.findByDepartmentId(departmentId));
	}

	@PostMapping("/staff-members")
	public ResponseEntity<StaffMember> create(@RequestBody StaffMemberRequest body) {
		StaffMember staffMember = new StaffMember();
		staffMember.setUserId(body.getUserId());
		staffMember.setHotelId(body.getHotelId());
		staffMember.setDepartmentId(body.getDepartmentId());
		return ResponseEntity.ok(service.create(staffMember));
	}

	@PutMapping("/staff-members/{id}")
	public ResponseEntity<StaffMember> update(@PathVariable Long id, @RequestBody StaffMemberRequest body) {
		StaffMember partial = new StaffMember();
		partial.setUserId(body.getUserId());
		partial.setHotelId(body.getHotelId());
		partial.setDepartmentId(body.getDepartmentId());
		return ResponseEntity.ok(service.update(id, partial));
	}

	@DeleteMapping("/staff-members/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	@Data
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public static class StaffMemberRequest {
		private Integer userId;
		private Long hotelId;
		private Long departmentId;
		private String name;
	}
}