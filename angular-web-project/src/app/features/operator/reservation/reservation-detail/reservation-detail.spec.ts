import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationDetail } from './reservation-detail';

describe('ReservationDetail', () => {
  let component: ReservationDetail;
  let fixture: ComponentFixture<ReservationDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
