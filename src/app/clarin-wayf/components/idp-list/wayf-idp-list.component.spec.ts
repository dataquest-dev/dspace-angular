import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WayfIdpListComponent } from './wayf-idp-list.component';
import { IdentityProvider } from '../../models/idp-entry.model';

describe('WayfIdpListComponent', () => {
  let component: WayfIdpListComponent;
  let fixture: ComponentFixture<WayfIdpListComponent>;

  const entries: IdentityProvider[] = [
    { entityID: 'https://a.example.org', title: 'Alpha University' },
    { entityID: 'https://b.example.org', title: 'Beta University' },
    { entityID: 'https://c.example.org', title: 'Charlie University' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WayfIdpListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WayfIdpListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entries', entries);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render one card per entry', () => {
    const cards = fixture.nativeElement.querySelectorAll('ds-wayf-idp-card');
    expect(cards.length).toBe(3);
  });

  it('should show "no results" when entries is empty', () => {
    fixture.componentRef.setInput('entries', []);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.wayf-idp-list__empty');
    expect(empty).toBeTruthy();
  });

  // ── Keyboard navigation ─────────────────────────────────────

  describe('onKeydown()', () => {
    it('should move activeIndex down on ArrowDown', () => {
      component.activeIndex.set(-1);
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.activeIndex()).toBe(0);
    });

    it('should not go past last entry on ArrowDown', () => {
      component.activeIndex.set(2);
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.activeIndex()).toBe(2);
    });

    it('should move activeIndex up on ArrowUp', () => {
      component.activeIndex.set(2);
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(component.activeIndex()).toBe(1);
    });

    it('should emit focusSearch when ArrowUp at index 0', () => {
      const spy = jasmine.createSpy('focusSearch');
      component.focusSearch.subscribe(spy);

      component.activeIndex.set(0);
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

      expect(spy).toHaveBeenCalled();
      expect(component.activeIndex()).toBe(-1);
    });

    it('should emit idpSelected on Enter when an item is active', () => {
      const spy = jasmine.createSpy('idpSelected');
      component.idpSelected.subscribe(spy);

      component.activeIndex.set(1);
      component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(spy).toHaveBeenCalledWith(entries[1]);
    });

    it('should not emit idpSelected on Enter when no item is active', () => {
      const spy = jasmine.createSpy('idpSelected');
      component.idpSelected.subscribe(spy);

      component.activeIndex.set(-1);
      component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit focusSearch on Escape', () => {
      const spy = jasmine.createSpy('focusSearch');
      component.focusSearch.subscribe(spy);

      component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('resetActive()', () => {
    it('should reset activeIndex to -1', () => {
      component.activeIndex.set(2);
      component.resetActive();
      expect(component.activeIndex()).toBe(-1);
    });
  });
});
