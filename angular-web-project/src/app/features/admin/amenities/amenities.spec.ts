import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Amenities } from './amenities';

describe('Amenities', () => {
  let component: Amenities;
  let fixture: ComponentFixture<Amenities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Amenities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Amenities);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
