import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationDetailOp } from './reservation-detail-op';

describe('ReservationDetailOp', () => {
  let component: ReservationDetailOp;
  let fixture: ComponentFixture<ReservationDetailOp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationDetailOp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationDetailOp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
