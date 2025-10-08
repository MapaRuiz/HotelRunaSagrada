import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperatorReservationService } from './operator-reservation-service';

describe('OperatorReservationService', () => {
  let component: OperatorReservationService;
  let fixture: ComponentFixture<OperatorReservationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorReservationService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperatorReservationService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
