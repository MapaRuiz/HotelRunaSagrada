import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceScheduleForm } from './service-schedule-form';

describe('ServiceScheduleForm', () => {
  let component: ServiceScheduleForm;
  let fixture: ComponentFixture<ServiceScheduleForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceScheduleForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceScheduleForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
