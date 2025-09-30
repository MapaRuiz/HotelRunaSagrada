import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffMemberList } from './staff-member-list';

describe('StaffMemberList', () => {
  let component: StaffMemberList;
  let fixture: ComponentFixture<StaffMemberList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffMemberList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffMemberList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
