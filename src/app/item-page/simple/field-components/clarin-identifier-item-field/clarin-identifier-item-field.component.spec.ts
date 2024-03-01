import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClarinIdentifierItemFieldComponent } from './clarin-identifier-item-field.component';

describe('ClarinIdentifierItemFieldComponent', () => {
  let component: ClarinIdentifierItemFieldComponent;
  let fixture: ComponentFixture<ClarinIdentifierItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinIdentifierItemFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClarinIdentifierItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
