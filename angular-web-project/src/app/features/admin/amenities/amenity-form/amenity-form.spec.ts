import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmenityForm } from './amenity-form';

describe('Amenities', () => {
  let component: AmenityForm;
  let fixture: ComponentFixture<AmenityForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmenityForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmenityForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
