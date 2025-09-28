import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelHero } from './hotel-hero';

describe('HotelHero', () => {
  let component: HotelHero;
  let fixture: ComponentFixture<HotelHero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelHero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelHero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
