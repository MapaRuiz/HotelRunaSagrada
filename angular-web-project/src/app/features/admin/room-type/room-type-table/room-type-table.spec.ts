import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomTypeTable } from './room-type-table';

describe('RoomTypeTable', () => {
  let component: RoomTypeTable;
  let fixture: ComponentFixture<RoomTypeTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomTypeTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomTypeTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
