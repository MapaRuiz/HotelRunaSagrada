import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestimonialsSection } from './testimonials-section';

describe('TestimonialsSection', () => {
  let component: TestimonialsSection;
  let fixture: ComponentFixture<TestimonialsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestimonialsSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestimonialsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
