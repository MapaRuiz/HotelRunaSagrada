import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomGallery } from './room-gallery';

describe('RoomGallery', () => {
  let component: RoomGallery;
  let fixture: ComponentFixture<RoomGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
