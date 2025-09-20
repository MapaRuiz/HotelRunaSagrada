import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesTable } from './services-table';

describe('ServicesTable', () => {
  let component: ServicesTable;
  let fixture: ComponentFixture<ServicesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
