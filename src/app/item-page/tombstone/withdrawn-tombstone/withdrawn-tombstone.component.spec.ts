import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawnTombstoneComponent } from './withdrawn-tombstone.component';

describe('WithdrawnTombstoneComponent', () => {
  let component: WithdrawnTombstoneComponent;
  let fixture: ComponentFixture<WithdrawnTombstoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WithdrawnTombstoneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawnTombstoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
