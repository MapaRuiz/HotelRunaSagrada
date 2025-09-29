import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ServiceSchedule } from '../../../../model/service-schedule';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-schedule-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './service-schedule-form.html',
  styleUrl: './service-schedule-form.css'
})
export class ServiceScheduleForm {
  @Input() draft: Partial<ServiceSchedule> = {};
  @Input() loading = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<ServiceSchedule>();

  submit(): void {
    this.save.emit(this.draft as ServiceSchedule);
  }
}
