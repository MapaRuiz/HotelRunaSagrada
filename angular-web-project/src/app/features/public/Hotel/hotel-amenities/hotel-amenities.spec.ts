import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelAmenities } from './hotel-amenities';

describe('HotelAmenities', () => {
  let component: HotelAmenities;
  let fixture: ComponentFixture<HotelAmenities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelAmenities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelAmenities);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
