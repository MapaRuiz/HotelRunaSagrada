import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomTypeForm } from './room-type-form';

describe('RoomTypeForm', () => {
  let component: RoomTypeForm;
  let fixture: ComponentFixture<RoomTypeForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomTypeForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomTypeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
