import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesScheduleTable } from './services-schedule-table';

describe('ServicesScheduleTable', () => {
  let component: ServicesScheduleTable;
  let fixture: ComponentFixture<ServicesScheduleTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesScheduleTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesScheduleTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
