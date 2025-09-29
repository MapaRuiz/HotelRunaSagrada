package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.StaffMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StaffMemberRepository extends JpaRepository<StaffMember, Long> {
	List<StaffMember> findByUserId(Integer userId);

	List<StaffMember> findByHotelId(Long hotelId);

	List<StaffMember> findByDepartmentId(Long departmentId);

	boolean existsByUserIdAndHotelId(Integer userId, Long hotelId);
}