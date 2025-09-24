import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionButtonsCell } from './action-buttons-cell';

describe('ActionButtonsCell', () => {
  let component: ActionButtonsCell;
  let fixture: ComponentFixture<ActionButtonsCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionButtonsCell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionButtonsCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
