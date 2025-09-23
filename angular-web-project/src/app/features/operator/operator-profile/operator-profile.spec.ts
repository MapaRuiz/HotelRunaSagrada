import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperatorProfile } from './operator-profile';

describe('OperatorProfile', () => {
  let component: OperatorProfile;
  let fixture: ComponentFixture<OperatorProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperatorProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
