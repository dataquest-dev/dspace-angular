import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WayfIdpCardComponent } from './wayf-idp-card.component';
import { IdentityProvider } from '../../models/idp-entry.model';

describe('WayfIdpCardComponent', () => {
  let component: WayfIdpCardComponent;
  let fixture: ComponentFixture<WayfIdpCardComponent>;

  const mockEntry: IdentityProvider = {
    entityID: 'https://idp.example.org',
    title: 'Example University',
    logoUrl: 'https://example.org/logo.png',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WayfIdpCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WayfIdpCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entry', mockEntry);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the IdP title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.wayf-idp-card__name')?.textContent?.trim()).toBe('Example University');
  });

  it('should display the entityID', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.wayf-idp-card__entity-id')?.textContent?.trim()).toBe('https://idp.example.org');
  });

  it('should show logo image when logoUrl is provided', () => {
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('logo.png');
  });

  it('should show placeholder icon when no logoUrl', () => {
    fixture.componentRef.setInput('entry', { entityID: 'e1', title: 'No Logo' });
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('.fas.fa-university');
    expect(icon).toBeTruthy();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('should show placeholder icon when logo fails to load', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();

    // Simulate image error
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.fas.fa-university')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('should emit selected event on click', () => {
    const spy = jasmine.createSpy('selected');
    component.selected.subscribe(spy);

    const card = fixture.nativeElement.querySelector('.wayf-idp-card');
    card.click();

    expect(spy).toHaveBeenCalledWith(mockEntry);
  });

  it('should show hub badge when isHub is true', () => {
    fixture.componentRef.setInput('isHub', true);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge).toBeTruthy();
  });

  it('should not show hub badge when isHub is false', () => {
    fixture.componentRef.setInput('isHub', false);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge).toBeNull();
  });

  it('should apply active class when isActive is true', () => {
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.wayf-idp-card');
    expect(card.classList).toContain('wayf-idp-card--active');
  });
});
