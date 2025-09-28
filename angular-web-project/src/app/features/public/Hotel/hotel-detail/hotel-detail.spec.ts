import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetail } from './hotel-detail';

describe('HotelDetail', () => {
  let component: HotelDetail;
  let fixture: ComponentFixture<HotelDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
