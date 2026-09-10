import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  NO_ERRORS_SCHEMA,
  ViewContainerRef,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import {
  of,
  Subject,
} from 'rxjs';

import { BitstreamChecksumDataService } from '../../../../core/bitstream-checksum-data.service';
import { BundleDataService } from '../../../../core/data/bundle-data.service';
import { FieldChangeType } from '../../../../core/data/object-updates/field-change-type.model';
import { FieldUpdate } from '../../../../core/data/object-updates/field-update.model';
import { ObjectUpdatesService } from '../../../../core/data/object-updates/object-updates.service';
import { RequestService } from '../../../../core/data/request.service';
import { PaginationService } from '../../../../core/pagination/pagination.service';
import {
  Bitstream,
  SYNCHRONIZED_STORES_NUMBER,
} from '../../../../core/shared/bitstream.model';
import { BitstreamChecksum } from '../../../../core/shared/bitstream-checksum.model';
import { Bundle } from '../../../../core/shared/bundle.model';
import { Item } from '../../../../core/shared/item.model';
import { getMockRequestService } from '../../../../shared/mocks/request.service.mock';
import { createSuccessfulRemoteDataObject$ } from '../../../../shared/remote-data.utils';
import { ResponsiveColumnSizes } from '../../../../shared/responsive-table-sizes/responsive-column-sizes';
import { ResponsiveTableSizes } from '../../../../shared/responsive-table-sizes/responsive-table-sizes';
import { PaginationServiceStub } from '../../../../shared/testing/pagination-service.stub';
import { createPaginatedList } from '../../../../shared/testing/utils.test';
import {
  BitstreamTableEntry,
  ItemBitstreamsService,
  SelectedBitstreamTableEntry,
} from '../item-bitstreams.service';
import {
  getItemBitstreamsServiceStub,
  ItemBitstreamsServiceStub,
} from '../item-bitstreams.service.stub';
import { ItemEditBitstreamBundleComponent } from './item-edit-bitstream-bundle.component';

describe('ItemEditBitstreamBundleComponent', () => {
  let comp: ItemEditBitstreamBundleComponent;
  let fixture: ComponentFixture<ItemEditBitstreamBundleComponent>;
  let viewContainerRef: ViewContainerRef;

  const columnSizes = new ResponsiveTableSizes([
    new ResponsiveColumnSizes(3, 3, 3, 3, 3),
    new ResponsiveColumnSizes(3, 3, 3, 3, 3),
    new ResponsiveColumnSizes(2, 2, 2, 2, 2),
    new ResponsiveColumnSizes(2, 2, 2, 2, 2),
    new ResponsiveColumnSizes(2, 2, 2, 2, 2),
  ]);


  const md5 = (value: string) => ({ checkSumAlgorithm: 'MD5', value });
  const checksumAllEqual = Object.assign(new BitstreamChecksum(), {
    databaseChecksum: md5('abc'),
    activeStore: md5('abc'),
    synchronizedStore: md5('abc'),
  });

  const tableEntry = (storeNumber: number, checksumHref?: string): BitstreamTableEntry => ({
    bitstream: Object.assign(new Bitstream(), {
      uuid: 'bitstream-1',
      storeNumber,
      _links: checksumHref ? { checksum: { href: checksumHref } } : {},
    }),
    id: 'bitstream-1',
    name: 'file.txt',
    nameStripped: 'file.txt',
    description: '',
    format: of(null),
    downloadUrl: 'download-url',
  } as any);

  const item = Object.assign(new Item(), {
    id: 'item-1',
    uuid: 'item-1',
  });
  const bundle = Object.assign(new Bundle(), {
    id: 'bundle-1',
    uuid: 'bundle-1',
    _links: {
      self: { href: 'bundle-1-selflink' },
    },
  });

  const restEndpoint = 'fake-rest-endpoint';
  const bundleService = jasmine.createSpyObj('bundleService', {
    getBitstreamsEndpoint: of(restEndpoint),
    getBitstreams: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  });

  let objectUpdatesService: any;
  let itemBitstreamsService: ItemBitstreamsServiceStub;
  let bitstreamChecksumService: jasmine.SpyObj<BitstreamChecksumDataService>;

  beforeEach(waitForAsync(() => {
    objectUpdatesService = jasmine.createSpyObj('objectUpdatesService', {
      initialize: undefined,
      getFieldUpdatesExclusive: of(null),
    });

    itemBitstreamsService = getItemBitstreamsServiceStub();
    bitstreamChecksumService = jasmine.createSpyObj('bitstreamChecksumService', ['findByHref']);
    bitstreamChecksumService.findByHref.and.returnValue(createSuccessfulRemoteDataObject$(checksumAllEqual));

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), ItemEditBitstreamBundleComponent],
      providers: [
        { provide: BundleDataService, useValue: bundleService },
        { provide: ObjectUpdatesService, useValue: objectUpdatesService },
        { provide: PaginationService, useValue: new PaginationServiceStub() },
        { provide: RequestService, useValue: getMockRequestService() },
        { provide: ItemBitstreamsService, useValue: itemBitstreamsService },
        { provide: BitstreamChecksumDataService, useValue: bitstreamChecksumService },
      ],
      schemas: [
        NO_ERRORS_SCHEMA,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemEditBitstreamBundleComponent);
    comp = fixture.componentInstance;
    comp.item = item;
    comp.bundle = bundle;
    comp.columnSizes = columnSizes;
    viewContainerRef = (comp as any).viewContainerRef;
    spyOn(viewContainerRef, 'createEmbeddedView');
    fixture.detectChanges();
  });

  it('should create an embedded view of the component', () => {
    expect(viewContainerRef.createEmbeddedView).toHaveBeenCalled();
  });

  describe('on selected entry change', () => {
    let paginationComponent: any;
    let testSubject: Subject<SelectedBitstreamTableEntry> = new Subject();

    beforeEach(() => {
      paginationComponent = jasmine.createSpyObj('paginationComponent', {
        doPageChange: undefined,
      });
      comp.paginationComponent = paginationComponent;

      spyOn<any>(comp, 'getCurrentPageSize').and.returnValue(2);
    });

    it('should move to the page the selected entry is on if were not on that page', () => {

      const entry: SelectedBitstreamTableEntry = {
        bitstream: null,
        bundle: bundle,
        bundleSize: 5,
        originalPosition: 1,
        currentPosition: 2,
      };

      comp.handleSelectionAction({ action: 'Moved', selectedEntry: entry });
      expect(paginationComponent.doPageChange).toHaveBeenCalledWith(2);
    });

    it('should not change page when we are already on the correct page', () => {
      const entry: SelectedBitstreamTableEntry = {
        bitstream: null,
        bundle: bundle,
        bundleSize: 5,
        originalPosition: 0,
        currentPosition: 1,
      };

      comp.handleSelectionAction({ action: 'Moved', selectedEntry: entry });
      expect(paginationComponent.doPageChange).not.toHaveBeenCalled();
    });

    it('should change to the original page when cancelling', () => {
      const entry: SelectedBitstreamTableEntry = {
        bitstream: null,
        bundle: bundle,
        bundleSize: 5,
        originalPosition: 3,
        currentPosition: 0,
      };

      comp.handleSelectionAction({ action: 'Cancelled', selectedEntry: entry });
      expect(paginationComponent.doPageChange).toHaveBeenCalledWith(2);
    });

    it('should not change page when we are already on the correct page when cancelling', () => {
      const entry: SelectedBitstreamTableEntry = {
        bitstream: null,
        bundle: bundle,
        bundleSize: 5,
        originalPosition: 0,
        currentPosition: 3,
      };

      comp.handleSelectionAction({ action: 'Cancelled', selectedEntry: entry });
      expect(paginationComponent.doPageChange).not.toHaveBeenCalled();
    });
  });

  describe('getRowClass', () => {
    it('should return \'table-info\' when the bitstream is the selected bitstream', () => {
      itemBitstreamsService.getSelectedBitstream.and.returnValue({
        bitstream: { id: 'bitstream-id' },
      });

      const bitstreamEntry = {
        id: 'bitstream-id',
      } as BitstreamTableEntry;

      expect(comp.getRowClass(undefined, bitstreamEntry)).toEqual('table-info');
    });

    it('should return \'table-warning\' when the update is of type \'UPDATE\'', () => {
      const update = {
        changeType: FieldChangeType.UPDATE,
      } as FieldUpdate;

      expect(comp.getRowClass(update, undefined)).toEqual('table-warning');
    });

    it('should return \'table-success\' when the update is of type \'ADD\'', () => {
      const update = {
        changeType: FieldChangeType.ADD,
      } as FieldUpdate;

      expect(comp.getRowClass(update, undefined)).toEqual('table-success');
    });

    it('should return \'table-danger\' when the update is of type \'REMOVE\'', () => {
      const update = {
        changeType: FieldChangeType.REMOVE,
      } as FieldUpdate;

      expect(comp.getRowClass(update, undefined)).toEqual('table-danger');
    });

    it('should return \'bg-white\' in any other case', () => {
      const update = {
        changeType: undefined,
      } as FieldUpdate;

      expect(comp.getRowClass(update, undefined)).toEqual('bg-white');
    });
  });

  describe('drag', () => {
    let dragTooltip;
    let paginationComponent;

    beforeEach(() => {
      dragTooltip = jasmine.createSpyObj('dragTooltip', {
        open: undefined,
        close: undefined,
      });
      comp.dragTooltip = dragTooltip;
    });

    describe('Start', () => {
      it('should open the tooltip when there are multiple pages', () => {
        paginationComponent = jasmine.createSpyObj('paginationComponent', {
          doPageChange: undefined,
        }, {
          shouldShowBottomPager: of(true),
        });
        comp.paginationComponent = paginationComponent;

        comp.dragStart();
        expect(dragTooltip.open).toHaveBeenCalled();
      });

      it('should not open the tooltip when there is only a single page', () => {
        paginationComponent = jasmine.createSpyObj('paginationComponent', {
          doPageChange: undefined,
        }, {
          shouldShowBottomPager: of(false),
        });
        comp.paginationComponent = paginationComponent;

        comp.dragStart();
        expect(dragTooltip.open).not.toHaveBeenCalled();
      });
    });

    describe('end', () => {
      it('should always close the tooltip', () => {
        paginationComponent = jasmine.createSpyObj('paginationComponent', {
          doPageChange: undefined,
        }, {
          shouldShowBottomPager: of(false),
        });
        comp.paginationComponent = paginationComponent;

        comp.dragEnd();
        expect(dragTooltip.close).toHaveBeenCalled();
      });
    });
  });

  describe('drop', () => {
    it('should correctly move the bitstream on drop', () => {
      const event = {
        previousIndex: 1,
        currentIndex: 8,
        dropPoint: { x: 100, y: 200 },
      } as CdkDragDrop<any>;

      comp.drop(event);
      expect(itemBitstreamsService.performBitstreamMoveRequest).toHaveBeenCalledWith(jasmine.any(Bundle), 1, 8, jasmine.any(Function));
    });

    it('should not move the bitstream if dropped in the same place', () => {
      const event = {
        previousIndex: 1,
        currentIndex: 1,
        dropPoint: { x: 100, y: 200 },
      } as CdkDragDrop<any>;

      comp.drop(event);
      expect(itemBitstreamsService.performBitstreamMoveRequest).not.toHaveBeenCalled();
    });

    it('should move to a different page if dropped on a page number', () => {
      spyOn(document, 'elementFromPoint').and.returnValue({
        textContent: '2',
        classList: { contains: (token: string) => true },
      } as Element);

      const event = {
        previousIndex: 1,
        currentIndex: 1,
        dropPoint: { x: 100, y: 200 },
      } as CdkDragDrop<any>;

      comp.drop(event);
      expect(itemBitstreamsService.performBitstreamMoveRequest).toHaveBeenCalledWith(jasmine.any(Bundle), 1, 20, jasmine.any(Function));
    });
  });

  describe('select', () => {
    it('should select the bitstream', () => {
      const event = new KeyboardEvent('keydown');
      spyOnProperty(event, 'repeat', 'get').and.returnValue(false);

      const entry = { } as BitstreamTableEntry;
      comp.tableEntries$.next([entry]);

      comp.select(event, entry);
      expect(itemBitstreamsService.selectBitstreamEntry).toHaveBeenCalledWith(jasmine.objectContaining({ bitstream: entry }));
    });

    it('should cancel the selection if the bitstream already is selected', () => {
      const event = new KeyboardEvent('keydown');
      spyOnProperty(event, 'repeat', 'get').and.returnValue(false);

      const entry = { } as BitstreamTableEntry;
      comp.tableEntries$.next([entry]);

      itemBitstreamsService.getSelectedBitstream.and.returnValue({ bitstream: entry });

      comp.select(event, entry);
      expect(itemBitstreamsService.selectBitstreamEntry).not.toHaveBeenCalled();
      expect(itemBitstreamsService.cancelSelection).toHaveBeenCalled();
    });

    it('should not do anything if the user is holding down the select key', () => {
      const event = new KeyboardEvent('keydown');
      spyOnProperty(event, 'repeat', 'get').and.returnValue(true);

      const entry = { } as BitstreamTableEntry;
      comp.tableEntries$.next([entry]);

      itemBitstreamsService.getSelectedBitstream.and.returnValue({ bitstream: entry });

      comp.select(event, entry);
      expect(itemBitstreamsService.selectBitstreamEntry).not.toHaveBeenCalled();
      expect(itemBitstreamsService.cancelSelection).not.toHaveBeenCalled();
    });
  });

  describe('bitstream checksum column', () => {

    it('should report a bitstream stored in both stores as synchronized', () => {
      expect(comp.isBitstreamSynchronized(tableEntry(SYNCHRONIZED_STORES_NUMBER))).toBeTrue();
      expect(comp.isBitstreamSynchronized(tableEntry(0))).toBeFalse();
    });

    it('should treat checksums with the same value but a different algorithm as unequal', () => {
      expect(comp.compareChecksums(md5('abc'), md5('abc'))).toBeTrue();
      expect(comp.compareChecksums(md5('abc'), { checkSumAlgorithm: 'SHA-256', value: 'abc' })).toBeFalse();
    });

    it('should compare the synchronized store as well, but only for a synchronized bitstream', () => {
      const syncStoreDiffers = Object.assign(new BitstreamChecksum(), {
        databaseChecksum: md5('abc'),
        activeStore: md5('abc'),
        synchronizedStore: md5('zzz'),
      });

      expect(comp.checksumsAreEqual(syncStoreDiffers, tableEntry(SYNCHRONIZED_STORES_NUMBER))).toBeFalse();
      expect(comp.checksumsAreEqual(syncStoreDiffers, tableEntry(0))).toBeTrue();
    });

    it('should request the checksum of the row it was given, not of the selected row', () => {
      const entry = tableEntry(SYNCHRONIZED_STORES_NUMBER, 'https://rest/api/core/bitstreams/bitstream-1/checksum');

      comp.computeChecksum(entry);

      expect(bitstreamChecksumService.findByHref)
        .toHaveBeenCalledWith('https://rest/api/core/bitstreams/bitstream-1/checksum');
      expect(itemBitstreamsService.getSelectedBitstream).not.toHaveBeenCalled();

      let emitted: BitstreamChecksum = null;
      comp.checkSum$.subscribe((value) => emitted = value);

      expect(emitted).toBe(checksumAllEqual);
      expect(comp.computedChecksum).toBeTrue();
      expect(comp.loading).toBeFalse();
    });

    it('should do nothing when the row has no checksum link', () => {
      const entry = tableEntry(0);

      expect(() => comp.computeChecksum(entry)).not.toThrow();
      expect(bitstreamChecksumService.findByHref).not.toHaveBeenCalled();
      expect(comp.loading).toBeFalse();
    });
  });
});
