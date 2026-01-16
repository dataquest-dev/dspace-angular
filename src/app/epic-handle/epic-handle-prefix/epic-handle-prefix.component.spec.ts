import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EpicHandlePrefixComponent } from './epic-handle-prefix.component';
import { EpicHandleDataService } from '../../core/data/epic-handle-data.service';
import { TranslateModule } from '@ngx-translate/core';

describe('EpicPrefixHandlePageComponent', () => {
  let component: EpicHandlePrefixComponent;
  let fixture: ComponentFixture<EpicHandlePrefixComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const epicHandleServiceSpy = {};

    await TestBed.configureTestingModule({
      declarations: [EpicHandlePrefixComponent],
      imports: [ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: EpicHandleDataService, useValue: epicHandleServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EpicHandlePrefixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty prefix', () => {
      expect(component.prefixForm.get('prefix').value).toBe('');
    });

    it('should have required validator', () => {
      const prefixControl = component.prefixForm.get('prefix');
      prefixControl.setValue('');
      expect(prefixControl.hasError('required')).toBe(true);
    });

    it('should have pattern validator for alphanumeric only', () => {
      const prefixControl = component.prefixForm.get('prefix');

      prefixControl.setValue('invalid-prefix!');
      expect(prefixControl.hasError('pattern')).toBe(true);

      prefixControl.setValue('valid123');
      expect(prefixControl.hasError('pattern')).toBe(false);
    });

    it('should be invalid when empty', () => {
      expect(component.prefixForm.valid).toBe(false);
    });

    it('should be valid with alphanumeric prefix', () => {
      component.prefixForm.get('prefix').setValue('11148');
      expect(component.prefixForm.valid).toBe(true);
    });
  });

  describe('navigateToEpicHandleList', () => {
    it('should navigate when form is valid', () => {
      component.prefixForm.get('prefix').setValue('11148');
      component.navigateToEpicHandleList({ prefix: '11148' });
      expect(router.navigate).toHaveBeenCalledWith(['/epic-handle-table'], { queryParams: { prefix: '11148' } });
    });

    it('should trim whitespace from prefix', () => {
      component.prefixForm.get('prefix').setValue('  11148  ');
      component.navigateToEpicHandleList({ prefix: '  11148  ' });
    });

    it('should not navigate when form is invalid', () => {
      component.prefixForm.get('prefix').setValue('');
      component.navigateToEpicHandleList({ prefix: '' });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when prefix is null', () => {
      component.navigateToEpicHandleList({ prefix: null });

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('hasError', () => {
    it('should return true for required error when touched', () => {
      const prefixControl = component.prefixForm.get('prefix');
      prefixControl.setValue('');
      prefixControl.markAsTouched();

      expect(component.hasError('prefix', 'required')).toBe(true);
    });

    it('should return true for pattern error when dirty', () => {
      const prefixControl = component.prefixForm.get('prefix');
      prefixControl.setValue('invalid!');
      prefixControl.markAsDirty();

      expect(component.hasError('prefix', 'pattern')).toBe(true);
    });

    it('should return false when not touched or dirty', () => {
      const prefixControl = component.prefixForm.get('prefix');
      prefixControl.setValue('');

      expect(component.hasError('prefix', 'required')).toBe(false);
    });

    it('should return false when no error', () => {
      const prefixControl = component.prefixForm.get('prefix');
      prefixControl.setValue('11148');
      prefixControl.markAsTouched();

      expect(component.hasError('prefix', 'required')).toBe(false);
    });
  });
});
