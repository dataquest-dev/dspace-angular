/* eslint-disable max-classes-per-file */
import {
  Component,
  DebugElement,
  NO_ERRORS_SCHEMA,
  Type,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

import { ThemeConfig } from '../../../config/theme.config';
import { hasValue } from '../empty.util';
import { getMockThemeService } from '../mocks/theme-service.mock';
import { VarDirective } from '../utils/var.directive';
import { TestComponent } from './test/test.component.spec';
import { ThemeService } from './theme.service';
import { ThemedComponent } from './themed.component';

@Component({
  selector: 'ds-test-themed-component',
  templateUrl: './themed.component.html',
})
class TestThemedComponent extends ThemedComponent<TestComponent> {
  protected inAndOutputNames: (keyof TestComponent & keyof this)[] = ['testInput'];

  testInput = 'unset';

  protected getComponentName(): string {
    return 'TestComponent';
  }
  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`./test/${themeName}/themed-test.component.spec`);
  }
  protected importUnthemedComponent(): Promise<any> {
    return import('./test/test.component.spec');
  }
}

@Component({
  selector: 'ds-test-themed-host',
  template: '<ds-test-themed-component><span>projected</span></ds-test-themed-component>',
  imports: [
    TestThemedComponent,
  ],
})
class TestThemedHostComponent {
}

@Component({
  selector: 'ds-test-themed-skip-host',
  template: '<ds-test-themed-component ngSkipHydration></ds-test-themed-component>',
  imports: [
    TestThemedComponent,
  ],
})
class TestThemedSkipHostComponent {
}

describe('ThemedComponent', () => {
  let component: TestThemedComponent;
  let fixture: ComponentFixture<TestThemedComponent>;
  let themeService: ThemeService;

  function setupTestingModuleForTheme(theme: string, themes?: ThemeConfig[]) {
    themeService = getMockThemeService(theme, themes);
    TestBed.configureTestingModule({
      imports: [TestThemedComponent, VarDirective],
      providers: [
        { provide: ThemeService, useValue: themeService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }

  function initComponent() {
    fixture = TestBed.createComponent(TestThemedComponent);
    component = fixture.componentInstance;
    spyOn(component as any, 'importThemedComponent').and.callThrough();
    component.testInput = 'changed';
    fixture.detectChanges();
  }

  describe('hydration', () => {
    beforeEach(waitForAsync(() => {
      setupTestingModuleForTheme('custom');
    }));

    async function whenRendered(themed: TestThemedComponent, themedFixture: ComponentFixture<unknown>) {
      await firstValueFrom(themed.compRef$.pipe(filter((compRef) => hasValue(compRef))));
      themedFixture.detectChanges();
    }

    async function renderHost(host: Type<unknown> = TestThemedHostComponent): Promise<DebugElement> {
      const hostFixture = TestBed.createComponent(host);
      hostFixture.detectChanges();
      const themed = hostFixture.debugElement.query(By.directive(TestThemedComponent));
      await whenRendered(themed.componentInstance, hostFixture);
      return themed;
    }

    it('should not skip hydration when no content is projected', async () => {
      initComponent();
      await whenRendered(component, fixture);
      expect(fixture.nativeElement.hasAttribute('ngSkipHydration')).toBeFalse();
    });

    it('should skip hydration when content is projected', async () => {
      const themed = await renderHost();
      expect(themed.nativeElement.hasAttribute('ngSkipHydration')).toBeTrue();
    });

    it('should keep a static ngSkipHydration when no content is projected', async () => {
      const themed = await renderHost(TestThemedSkipHostComponent);
      expect(themed.nativeElement.hasAttribute('ngSkipHydration')).toBeTrue();
    });

    it('should project the content into the themed component', async () => {
      const themed = await renderHost();
      expect(themed.nativeElement.querySelector(':scope > ds-test-component > span')?.textContent).toBe('projected');
    });

    it('should remove the content wrapper once the themed component is rendered', async () => {
      initComponent();
      await whenRendered(component, fixture);
      expect(fixture.nativeElement.querySelector(':scope > div')).toBeNull();
    });

    it('should not keep elements that are no longer in the DOM', async () => {
      initComponent();
      await whenRendered(component, fixture);
      const detached = fixture.debugElement.queryAll(By.all()).filter((el) => !el.nativeElement.isConnected);
      expect(detached.map((el) => el.name)).toEqual([]);
    });
  });

  describe('when the current theme matches a themed component', () => {
    beforeEach(waitForAsync(() => {
      setupTestingModuleForTheme('custom');
    }));

    beforeEach(initComponent);

    it('should set compRef to the themed component', waitForAsync(() => {
      fixture.whenStable().then(() => {
        expect((component as any).compRef.instance.type).toEqual('themed');
      });
    }));

    it('should sync up this component\'s input with the themed component', waitForAsync(() => {
      fixture.whenStable().then(() => {
        expect((component as any).compRef.instance.testInput).toEqual('changed');
      });
    }));

    it(`should set usedTheme to the name of the matched theme`, waitForAsync(() => {
      fixture.whenStable().then(() => {
        expect(component.usedTheme).toEqual('custom');
      });
    }));
  });

  describe('when the current theme doesn\'t match a themed component', () => {
    describe('and it doesn\'t extend another theme', () => {
      beforeEach(waitForAsync(() => {
        setupTestingModuleForTheme('non-existing-theme');
      }));

      beforeEach(initComponent);

      it('should set compRef to the default component', waitForAsync(() => {
        fixture.whenStable().then(() => {
          expect((component as any).compRef.instance.type).toEqual('default');
        });
      }));

      it('should sync up this component\'s input with the default component', waitForAsync(() => {
        fixture.whenStable().then(() => {
          expect((component as any).compRef.instance.testInput).toEqual('changed');
        });
      }));

      it(`should set usedTheme to the name of the base theme`, waitForAsync(() => {
        fixture.whenStable().then(() => {
          expect(component.usedTheme).toEqual('base');
        });
      }));
    });

    describe('and it extends another theme', () => {
      describe('that doesn\'t match it either', () => {
        beforeEach(waitForAsync(() => {
          setupTestingModuleForTheme('current-theme', [
            { name: 'current-theme', extends: 'non-existing-theme' },
          ]);
        }));

        beforeEach(initComponent);

        it('should set compRef to the default component', waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('current-theme');
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('non-existing-theme');
            expect((component as any).compRef.instance.type).toEqual('default');
          });
        }));

        it('should sync up this component\'s input with the default component', waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect((component as any).compRef.instance.testInput).toEqual('changed');
          });
        }));

        it(`should set usedTheme to the name of the base theme`, waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect(component.usedTheme).toEqual('base');
          });
        }));
      });

      describe('that does match it', () => {
        beforeEach(waitForAsync(() => {
          setupTestingModuleForTheme('current-theme', [
            { name: 'current-theme', extends: 'custom' },
          ]);
        }));

        beforeEach(initComponent);

        it('should set compRef to the themed component', waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('current-theme');
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('custom');
            expect((component as any).compRef.instance.type).toEqual('themed');
          });
        }));

        it('should sync up this component\'s input with the themed component', waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect((component as any).compRef.instance.testInput).toEqual('changed');
          });
        }));

        it(`should set usedTheme to the name of the matched theme`, waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect(component.usedTheme).toEqual('custom');
          });
        }));
      });

      describe('that extends another theme that doesn\'t match it either', () => {
        beforeEach(waitForAsync(() => {
          setupTestingModuleForTheme('current-theme', [
            { name: 'current-theme', extends: 'parent-theme' },
            { name: 'parent-theme', extends: 'non-existing-theme' },
          ]);
        }));

        beforeEach(initComponent);

        it('should set compRef to the default component', waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('current-theme');
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('parent-theme');
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('non-existing-theme');
            expect((component as any).compRef.instance.type).toEqual('default');
          });
        }));

        it('should sync up this component\'s input with the default component', waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect((component as any).compRef.instance.testInput).toEqual('changed');
          });
        }));

        it(`should set usedTheme to the name of the base theme`, waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect(component.usedTheme).toEqual('base');
          });
        }));
      });

      describe('that extends another theme that does match it', () => {
        beforeEach(waitForAsync(() => {
          setupTestingModuleForTheme('current-theme', [
            { name: 'current-theme', extends: 'parent-theme' },
            { name: 'parent-theme', extends: 'custom' },
          ]);
        }));

        beforeEach(initComponent);

        it('should set compRef to the themed component', waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('current-theme');
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('parent-theme');
            expect((component as any).importThemedComponent).toHaveBeenCalledWith('custom');
            expect((component as any).compRef.instance.type).toEqual('themed');
          });
        }));

        it('should sync up this component\'s input with the themed component', waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect((component as any).compRef.instance.testInput).toEqual('changed');
          });
        }));

        it(`should set usedTheme to the name of the matched theme`, waitForAsync(() => {
          fixture.whenStable().then(() => {
            expect(component.usedTheme).toEqual('custom');
          });
        }));
      });
    });
  });
});
