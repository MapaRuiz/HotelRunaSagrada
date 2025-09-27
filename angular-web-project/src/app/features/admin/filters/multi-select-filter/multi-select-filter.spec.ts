import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiSelectFilter } from './multi-select-filter';

describe('MultiSelectFilter', () => {
  let component: MultiSelectFilter;
  let fixture: ComponentFixture<MultiSelectFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelectFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiSelectFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
