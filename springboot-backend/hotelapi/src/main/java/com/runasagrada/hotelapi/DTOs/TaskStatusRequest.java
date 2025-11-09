package com.runasagrada.hotelapi.DTOs;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.runasagrada.hotelapi.model.Task.TaskStatus;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskStatusRequest {
    private TaskStatus status;
}
