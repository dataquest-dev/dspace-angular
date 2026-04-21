import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WayfSearchBarComponent } from './wayf-search-bar.component';

describe('WayfSearchBarComponent', () => {
  let component: WayfSearchBarComponent;
  let fixture: ComponentFixture<WayfSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WayfSearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WayfSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an input element', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(input).toBeTruthy();
  });

  it('should have a label for accessibility', () => {
    const label = fixture.nativeElement.querySelector('label');
    expect(label).toBeTruthy();
    expect(label.getAttribute('for')).toMatch(/^wayf-search-input-/);
  });

  it('should emit queryChange on input', () => {
    const spy = jasmine.createSpy('queryChange');
    component.queryChange.subscribe(spy);

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'test';
    input.dispatchEvent(new Event('input'));

    expect(spy).toHaveBeenCalledWith('test');
  });

  it('should have role="combobox" on input', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('role')).toBe('combobox');
  });

  it('should set aria-expanded based on hasResults', () => {
    fixture.componentRef.setInput('hasResults', true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  describe('focusInput()', () => {
    it('should focus the search input', () => {
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      spyOn(input, 'focus');
      component.focusInput();
      expect(input.focus).toHaveBeenCalled();
    });
  });
});
