package com.runasagrada.hotelapi.DTOs;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.runasagrada.hotelapi.model.Task.TaskStatus;
import com.runasagrada.hotelapi.model.Task.TaskType;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskRequest {
    private Long staffId;
    private Integer roomId;
    private Long resServiceId;
    private TaskType type;
    private TaskStatus status;
}
