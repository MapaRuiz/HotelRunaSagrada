import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientReservation } from './client-reservation';

describe('ClientReservation', () => {
  let component: ClientReservation;
  let fixture: ComponentFixture<ClientReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientReservation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientReservation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
