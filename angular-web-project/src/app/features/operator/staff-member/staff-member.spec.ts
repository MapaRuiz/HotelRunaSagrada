import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffMember } from './staff-member';

describe('StaffMember', () => {
  let component: StaffMember;
  let fixture: ComponentFixture<StaffMember>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffMember]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffMember);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
