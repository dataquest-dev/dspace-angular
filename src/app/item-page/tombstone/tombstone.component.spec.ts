import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TombstoneComponent } from './tombstone.component';

describe('TombstoneComponent', () => {
  let component: TombstoneComponent;
  let fixture: ComponentFixture<TombstoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TombstoneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TombstoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
