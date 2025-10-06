import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceModal } from './service-modal';

describe('ServiceModal', () => {
  let component: ServiceModal;
  let fixture: ComponentFixture<ServiceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
