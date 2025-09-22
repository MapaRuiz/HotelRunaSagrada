import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomType } from './room-type';

describe('RoomType', () => {
  let component: RoomType;
  let fixture: ComponentFixture<RoomType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomType]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomType);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
