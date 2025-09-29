package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.StaffMember;

import java.util.List;

public interface StaffMemberService {
	List<StaffMember> findAll();

	StaffMember findById(Long id);

	StaffMember create(StaffMember staffMember);

	StaffMember update(Long id, StaffMember partial);

	void delete(Long id);

	List<StaffMember> findByUserId(Integer userId);

	List<StaffMember> findByHotelId(Long hotelId);

	List<StaffMember> findByDepartmentId(Long departmentId);
}