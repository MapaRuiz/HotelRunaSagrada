import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Amenity, AmenityType } from '../../../../model/amenity';

export interface AmenityFormPayload {
  draft: Partial<Amenity>;
}

@Component({
  selector: 'app-amenity-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './amenity-form.html',
  styleUrls: ['./amenity-form.css']
})
export class AmenityFormComponent implements OnInit {
  @Input() amenity?: Amenity;
  @Input() loading = false;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<AmenityFormPayload>();

  draft: Partial<Amenity> = {};

  amenityTypes = AmenityType;
  imgBroken = false;

  constructor() {}

  ngOnInit(): void {
    if (this.amenity) {
      this.draft = { ...this.amenity };
    }
  }

  submit(): void {
    this.onSave.emit({
      draft: { ...this.draft }
    });
  }

  cancelEdit(): void {
    this.onCancel.emit();
  }

  onImageError(): void {
    this.imgBroken = true;
  }

  onImageLoad(): void {
    this.imgBroken = false;
  }
}