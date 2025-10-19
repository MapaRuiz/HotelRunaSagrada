import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationServicesTable } from './reservation-services-table';

describe('ReservationServicesTable', () => {
  let component: ReservationServicesTable;
  let fixture: ComponentFixture<ReservationServicesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationServicesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationServicesTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
