import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesOfferingComponent } from './services-offering-component';

describe('ServicesOfferingComponent', () => {
  let component: ServicesOfferingComponent;
  let fixture: ComponentFixture<ServicesOfferingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesOfferingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesOfferingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
