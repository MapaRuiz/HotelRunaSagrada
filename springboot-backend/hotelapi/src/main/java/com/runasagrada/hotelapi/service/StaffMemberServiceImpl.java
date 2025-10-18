package com.runasagrada.hotelapi.service;

import com.runasagrada.hotelapi.model.StaffMember;
import com.runasagrada.hotelapi.repository.StaffMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class StaffMemberServiceImpl implements StaffMemberService {

	@Autowired
	private StaffMemberRepository staffMembers;

	@Autowired
	private ServiceHelper helper;

	@Override
	@Transactional(readOnly = true)
	public List<StaffMember> findAll() {
		return staffMembers.findAll(Sort.by(Sort.Direction.ASC, "staffId"));
	}

	@Override
	@Transactional(readOnly = true)
	public StaffMember findById(Long id) {
		return staffMembers.findById(id).orElseThrow(() -> new NoSuchElementException("StaffMember not found"));
	}

	@Override
	public StaffMember findByUserId(Long userId) {
		return staffMembers.findByUserId(userId);
	}

	@Override
	public StaffMember create(StaffMember staffMember) {
		validate(staffMember);
		if (staffMember.getStaffId() != null)
			staffMember.setStaffId(null);
		helper.resyncIdentity("staff_members", "staff_id");
		return staffMembers.save(staffMember);
	}

	@Override
	public StaffMember update(Long id, StaffMember partial) {
		StaffMember db = findById(id);

		if (partial.getUserId() != null)
			db.setUserId(partial.getUserId());
		if (partial.getHotelId() != null)
			db.setHotelId(partial.getHotelId());
		if (partial.getDepartmentId() != null)
			db.setDepartmentId(partial.getDepartmentId());

		validate(db);
		return staffMembers.save(db);
	}

	@Override
	public void delete(Long id) {
		StaffMember db = findById(id);
		staffMembers.delete(db);
		helper.resyncIdentity("staff_members", "staff_id");
	}

	@Override
	@Transactional(readOnly = true)
	public List<StaffMember> findByHotelId(Long hotelId) {
		return staffMembers.findByHotelId(hotelId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<StaffMember> findByDepartmentId(Long departmentId) {
		return staffMembers.findByDepartmentId(departmentId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<StaffMember> findByDepartmentIdWithUser(Long departmentId) {
		return staffMembers.findByDepartmentIdWithUser(departmentId);
	}

	private void validate(StaffMember staffMember) {
		if (staffMember.getUserId() == null)
			throw new IllegalArgumentException("User ID is required");
		if (staffMember.getHotelId() == null)
			throw new IllegalArgumentException("Hotel ID is required");
		if (staffMember.getDepartmentId() == null)
			throw new IllegalArgumentException("Department ID is required");

		// Verificar que no haya duplicados
		if (staffMember.getStaffId() == null
				&& staffMembers.existsByUserIdAndHotelId(staffMember.getUserId(), staffMember.getHotelId()))
			throw new IllegalArgumentException("User is already a staff member in this hotel");
	}
}