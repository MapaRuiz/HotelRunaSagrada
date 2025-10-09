import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomTypeDetail } from './room-type-detail';

describe('RoomTypeDetail', () => {
  let component: RoomTypeDetail;
  let fixture: ComponentFixture<RoomTypeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomTypeDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomTypeDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
