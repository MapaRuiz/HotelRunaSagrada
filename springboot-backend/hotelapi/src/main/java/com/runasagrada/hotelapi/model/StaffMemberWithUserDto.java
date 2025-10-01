package com.runasagrada.hotelapi.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffMemberWithUserDto {
    private Long staffId;
    private Integer userId;
    private Long hotelId;
    private Long departmentId;
    private String name;
    private User user;

    public static StaffMemberWithUserDto fromStaffMember(StaffMember staffMember) {
        StaffMemberWithUserDto dto = new StaffMemberWithUserDto();
        dto.setStaffId(staffMember.getStaffId());
        dto.setUserId(staffMember.getUserId());
        dto.setHotelId(staffMember.getHotelId());
        dto.setDepartmentId(staffMember.getDepartmentId());
        dto.setUser(staffMember.getUser());
        return dto;
    }
}