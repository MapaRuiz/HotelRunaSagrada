import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomModal } from './room-modal';

describe('RoomModal', () => {
  let component: RoomModal;
  let fixture: ComponentFixture<RoomModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
