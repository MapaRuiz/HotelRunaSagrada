import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelLocation } from './hotel-location';

describe('HotelLocation', () => {
  let component: HotelLocation;
  let fixture: ComponentFixture<HotelLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelLocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelLocation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
