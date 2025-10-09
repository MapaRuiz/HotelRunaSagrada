import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentTable } from './department-table';

describe('DepartmentTable', () => {
  let component: DepartmentTable;
  let fixture: ComponentFixture<DepartmentTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
