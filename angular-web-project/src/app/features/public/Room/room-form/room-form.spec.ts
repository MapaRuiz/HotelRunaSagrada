import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomForm } from './room-form';

describe('RoomForm', () => {
  let component: RoomForm;
  let fixture: ComponentFixture<RoomForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
