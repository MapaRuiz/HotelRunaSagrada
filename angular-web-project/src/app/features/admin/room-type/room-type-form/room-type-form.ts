import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoomType } from '../../../../model/room-type';

export interface RoomTypeFormPayload {
  draft: Partial<RoomType>;
}

@Component({
  selector: 'app-room-type-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-type-form.html',
  styleUrls: ['./room-type-form.css']
})
export class RoomTypeFormComponent {
  @Input() draft: Partial<RoomType> = {};
  @Input() loading = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<RoomTypeFormPayload>();

  imgBroken = false;

  constructor() {}

  submit(): void {
    this.save.emit({
      draft: { ...this.draft }
    });
  }

  onImageError(): void {
    this.imgBroken = true;
  }

  onImageLoad(): void {
    this.imgBroken = false;
  }
}