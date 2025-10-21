import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillServices } from './bill-services';

describe('BillServices', () => {
  let component: BillServices;
  let fixture: ComponentFixture<BillServices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillServices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillServices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
