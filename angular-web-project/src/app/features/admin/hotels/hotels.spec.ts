import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hotels } from './hotels';

describe('Hotels', () => {
  let component: Hotels;
  let fixture: ComponentFixture<Hotels>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hotels]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hotels);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
