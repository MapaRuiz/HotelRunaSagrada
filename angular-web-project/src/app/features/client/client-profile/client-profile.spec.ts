import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProfile } from './client-profile';

describe('ClientProfile', () => {
  let component: ClientProfile;
  let fixture: ComponentFixture<ClientProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
