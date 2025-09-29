import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Department } from './department';

describe('Department', () => {
  let component: Department;
  let fixture: ComponentFixture<Department>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Department]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Department);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
