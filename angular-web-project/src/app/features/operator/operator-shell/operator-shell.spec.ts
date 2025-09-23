import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperatorShell } from './operator-shell';

describe('OperatorShell', () => {
  let component: OperatorShell;
  let fixture: ComponentFixture<OperatorShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperatorShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
