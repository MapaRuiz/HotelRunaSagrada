import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Primera } from './primera';

describe('Primera', () => {
  let component: Primera;
  let fixture: ComponentFixture<Primera>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Primera]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Primera);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
