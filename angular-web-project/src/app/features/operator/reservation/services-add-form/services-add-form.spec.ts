import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesAddForm } from './services-add-form';

describe('ServicesAddForm', () => {
  let component: ServicesAddForm;
  let fixture: ComponentFixture<ServicesAddForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesAddForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesAddForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
