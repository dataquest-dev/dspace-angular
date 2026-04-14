import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WayfRecentIdpsComponent } from './wayf-recent-idps.component';
import { WayfI18nService } from '../../services/i18n.service';
import { IdentityProvider } from '../../models/idp-entry.model';

describe('WayfRecentIdpsComponent', () => {
  let component: WayfRecentIdpsComponent;
  let fixture: ComponentFixture<WayfRecentIdpsComponent>;

  const allEntries: IdentityProvider[] = [
    { entityID: 'https://a.example.org', title: 'Alpha University' },
    { entityID: 'https://b.example.org', title: 'Beta University' },
    { entityID: 'https://default.example.org', title: 'Default University' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WayfRecentIdpsComponent],
      providers: [WayfI18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(WayfRecentIdpsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('allEntries', allEntries);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render nothing when no default or last-used IdP', () => {
    expect(component.shortcutEntry()).toBeNull();
    expect(fixture.nativeElement.querySelector('.wayf-shortcut')).toBeNull();
  });

  describe('with defaultEntityId', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('defaultEntityId', 'https://default.example.org');
      fixture.detectChanges();
    });

    it('should show the default IdP as shortcut', () => {
      expect(component.shortcutEntry()?.entityID).toBe('https://default.example.org');
    });

    it('should display the correct label for static default', () => {
      const el = fixture.nativeElement as HTMLElement;
      const label = el.querySelector('.small.text-muted')?.textContent?.trim();
      expect(label).toBe('Default institution');
    });

    it('should display the IdP name', () => {
      expect(component.shortcutDisplayName()).toBe('Default University');
    });
  });

  describe('with lastIdpEntityId', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('lastIdpEntityId', 'https://a.example.org');
      fixture.detectChanges();
    });

    it('should show the last-used IdP as shortcut', () => {
      expect(component.shortcutEntry()?.entityID).toBe('https://a.example.org');
    });

    it('should display "Continue with" label', () => {
      const el = fixture.nativeElement as HTMLElement;
      const label = el.querySelector('.small.text-muted')?.textContent?.trim();
      expect(label).toBe('Continue with');
    });
  });

  describe('priority: default over last-used', () => {
    it('should prefer defaultEntityId over lastIdpEntityId', () => {
      fixture.componentRef.setInput('defaultEntityId', 'https://default.example.org');
      fixture.componentRef.setInput('lastIdpEntityId', 'https://a.example.org');
      fixture.detectChanges();

      expect(component.shortcutEntry()?.entityID).toBe('https://default.example.org');
    });
  });

  describe('unknown IDs', () => {
    it('should render nothing for unknown defaultEntityId', () => {
      fixture.componentRef.setInput('defaultEntityId', 'https://unknown.example.org');
      fixture.detectChanges();

      expect(component.shortcutEntry()).toBeNull();
    });

    it('should render nothing for unknown lastIdpEntityId', () => {
      fixture.componentRef.setInput('lastIdpEntityId', 'https://unknown.example.org');
      fixture.detectChanges();

      expect(component.shortcutEntry()).toBeNull();
    });
  });

  describe('events', () => {
    it('should emit idpSelected on click', () => {
      fixture.componentRef.setInput('defaultEntityId', 'https://default.example.org');
      fixture.detectChanges();

      const spy = jasmine.createSpy('idpSelected');
      component.idpSelected.subscribe(spy);

      const card = fixture.nativeElement.querySelector('.wayf-shortcut__card');
      card.click();

      expect(spy).toHaveBeenCalledWith(allEntries[2]);
    });
  });
});
