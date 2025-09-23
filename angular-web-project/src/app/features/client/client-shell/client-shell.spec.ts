import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientShell } from './client-shell';

describe('ClientShell', () => {
  let component: ClientShell;
  let fixture: ComponentFixture<ClientShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
