package com.runasagrada.hotelapi.repository;

import com.runasagrada.hotelapi.model.StaffMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StaffMemberRepository extends JpaRepository<StaffMember, Long> {
	List<StaffMember> findByHotelId(Long hotelId);

	List<StaffMember> findByDepartmentId(Long departmentId);

	boolean existsByUserIdAndHotelId(Integer userId, Long hotelId);

	@Query("SELECT s FROM StaffMember s JOIN FETCH s.user WHERE s.departmentId = :departmentId ORDER BY s.staffId")
	List<StaffMember> findByDepartmentIdWithUser(@Param("departmentId") Long departmentId);

	StaffMember findByUserId(Long userId);

	@Query("SELECT s FROM StaffMember s JOIN s.user u JOIN u.roles r WHERE r.name = :role")
	List<StaffMember> findByUserRole(@Param("role") String role);

	@Query("SELECT s FROM StaffMember s JOIN s.department d WHERE LOWER(d.name) IN :names")
	List<StaffMember> findByDepartmentNames(@Param("names") List<String> names);
}