import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelServices } from './hotel-services';

describe('HotelServices', () => {
  let component: HotelServices;
  let fixture: ComponentFixture<HotelServices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelServices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelServices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
