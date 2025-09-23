import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperatorDashboard } from './operator-dashboard';

describe('OperatorDashboard', () => {
  let component: OperatorDashboard;
  let fixture: ComponentFixture<OperatorDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperatorDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
