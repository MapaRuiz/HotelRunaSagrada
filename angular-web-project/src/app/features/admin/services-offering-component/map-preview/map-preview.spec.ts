import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapPreview } from './map-preview';

describe('MapPreview', () => {
  let component: MapPreview;
  let fixture: ComponentFixture<MapPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapPreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
