import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Servicios } from './servicios';

describe('Servicios', () => {
  let component: Servicios;
  let fixture: ComponentFixture<Servicios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Servicios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Servicios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
