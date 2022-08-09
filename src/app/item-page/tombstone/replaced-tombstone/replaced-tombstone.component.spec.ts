import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplacedTombstoneComponent } from './replaced-tombstone.component';

describe('ReplacedTombstoneComponent', () => {
  let component: ReplacedTombstoneComponent;
  let fixture: ComponentFixture<ReplacedTombstoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReplacedTombstoneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplacedTombstoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
