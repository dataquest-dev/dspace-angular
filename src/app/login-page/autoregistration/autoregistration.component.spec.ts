import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoregistrationComponent } from './autoregistration.component';

describe('AutoregistrationComponent', () => {
  let component: AutoregistrationComponent;
  let fixture: ComponentFixture<AutoregistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutoregistrationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoregistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
