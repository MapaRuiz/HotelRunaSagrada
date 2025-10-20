import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultTable } from './search-result-table';

describe('SearchResultTable', () => {
  let component: SearchResultTable;
  let fixture: ComponentFixture<SearchResultTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchResultTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
