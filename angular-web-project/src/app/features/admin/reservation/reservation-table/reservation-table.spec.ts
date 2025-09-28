import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationTable } from './reservation-table';

describe('ReservationTable', () => {
  let component: ReservationTable;
  let fixture: ComponentFixture<ReservationTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
