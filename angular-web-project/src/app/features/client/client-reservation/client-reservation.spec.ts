import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientReservationComponent } from './client-reservation';

describe('ClientReservationComponent', () => {
  let component: ClientReservationComponent;
  let fixture: ComponentFixture<ClientReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientReservationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
