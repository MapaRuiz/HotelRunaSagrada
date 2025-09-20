import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesDetail } from './services-detail';

describe('ServicesDetail', () => {
  let component: ServicesDetail;
  let fixture: ComponentFixture<ServicesDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
