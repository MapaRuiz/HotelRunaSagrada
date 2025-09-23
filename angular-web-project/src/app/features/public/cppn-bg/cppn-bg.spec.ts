import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CppnBg } from './cppn-bg';

describe('CppnBg', () => {
  let component: CppnBg;
  let fixture: ComponentFixture<CppnBg>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CppnBg]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CppnBg);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
