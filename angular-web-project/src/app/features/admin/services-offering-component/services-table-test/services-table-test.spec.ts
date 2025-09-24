import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesTableTest } from './services-table-test';

describe('ServicesTableTest', () => {
  let component: ServicesTableTest;
  let fixture: ComponentFixture<ServicesTableTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesTableTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesTableTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
