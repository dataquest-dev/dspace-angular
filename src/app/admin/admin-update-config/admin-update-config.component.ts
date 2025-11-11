import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AdminUpdateConfigService, ConfigFile } from './admin-update-config.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ds-admin-update-config',
  templateUrl: './admin-update-config.component.html',
  styleUrls: ['./admin-update-config.component.scss']
})
export class AdminUpdateConfigComponent implements OnInit {

  /**
   * Available config files
   */
  configFiles: ConfigFile[] = [];

  /**
   * Currently selected file
   */
  selectedFile: ConfigFile | null = null;

  /**
   * Current file content
   */
  fileContent: string;

  /**
   * Original file content for reset functionality
   */
  originalContent: string;

  /**
   * Whether we're currently loading data
   */
  loading = false;

  /**
   * Whether we're currently saving
   */
  saving = false;



  constructor(
    private configService: AdminUpdateConfigService,
    private notificationsService: NotificationsService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadConfigFiles();
  }

  /**
   * Load available config files
   */
  loadConfigFiles(): void {
    this.loading = true;
    this.configService.getConfigFiles().subscribe({
      next: (files) => {
        this.configFiles = files;
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        this.loading = false;
        this.notificationsService.error(
          this.translateService.instant('admin.update-config.error.load-files.title'),
          this.translateService.instant('admin.update-config.error.load-files.message')
        );
        this.cdr.detectChanges(); // Force change detection
      }
    });
  }

  /**
   * Handle file selection from dropdown
   */
  onFileSelect(file: ConfigFile): void {
    if (!file) {
      this.selectedFile = null;
      this.fileContent = '';
      this.originalContent = '';
      this.cdr.detectChanges(); // Force change detection when clearing selection
      return;
    }

    this.selectedFile = file;
    this.cdr.detectChanges(); // Force change detection when file is selected
    this.loadFileContent(file.fileName);
  }

  /**
   * Load content of selected config file (instant loading!)
   */
  loadFileContent(filename: string): void {
    this.loading = true;
    this.cdr.detectChanges(); // Force change detection to show loading spinner

    // Instant subscription - no delays!
    this.configService.getConfigFileContent(filename).subscribe({
      next: (content) => {
        this.fileContent = content;
        this.originalContent = content;
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection to hide loading spinner
      },
      error: (error) => {
        this.loading = false;
        this.notificationsService.error(
          this.translateService.instant('admin.update-config.error.load-content.title'),
          this.translateService.instant('admin.update-config.error.load-content.message', { fileName: filename })
        );
        this.cdr.detectChanges(); // Force change detection on error
      }
    });
  }

  /**
   * Handle content changes in the editor
   */
  onContentChange(): void {
    // Content changed
  }

  /**
   * Save the current config file
   */
  saveFile(): void {
    if (!this.selectedFile || this.saving) {
      return;
    }

    this.saving = true;
    this.cdr.detectChanges(); // Force change detection to show saving state

    this.configService.saveConfigFile(this.selectedFile.fileName, this.fileContent).subscribe({
      next: (result) => {
        this.saving = false;
        this.originalContent = this.fileContent;

        this.notificationsService.success(
          this.translateService.instant('admin.update-config.success.save.title'),
          this.translateService.instant('admin.update-config.success.save.message', { fileName: this.selectedFile?.fileName })
        );

        this.loadConfigFiles();
        this.cdr.detectChanges(); // Force change detection after save
      },
      error: (error) => {
        this.saving = false;
        this.notificationsService.error(
          this.translateService.instant('admin.update-config.error.save.title'),
          this.translateService.instant('admin.update-config.error.save.message', { fileName: this.selectedFile?.fileName })
        );
        this.cdr.detectChanges(); // Force change detection on error
      }
    });
  }

  /**
   * Reset content to original version
   */
  resetContent(): void {
    this.fileContent = this.originalContent;
  }

  /**
   * Reset to original file
   */
  resetToOriginalFile(): void {
    if (!this.selectedFile) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges(); // Force change detection to show loading state

    this.configService.reloadOriginalContent(this.selectedFile.fileName).subscribe({
      next: (originalContent) => {
        this.fileContent = originalContent;
        this.originalContent = originalContent;
        this.loading = false;

        this.notificationsService.success(
          this.translateService.instant('admin.update-config.success.reload.title'),
          this.translateService.instant('admin.update-config.success.reload.message', { fileName: this.selectedFile?.fileName })
        );
        this.cdr.detectChanges(); // Force change detection after reload
      },
      error: (error) => {
        this.loading = false;
        this.notificationsService.error(
          this.translateService.instant('admin.update-config.error.reload.title'),
          this.translateService.instant('admin.update-config.error.reload.message')
        );
        this.cdr.detectChanges(); // Force change detection on error
      }
    });
  }

  /**
   * Check if content has unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this.fileContent !== this.originalContent;
  }

  /**
   * Get placeholder text for file selection
   */
  getFileSelectionText(): string {
    if (this.configFiles.length === 0) {
      return this.translateService.instant('admin.update-config.select.no-files');
    }
    return this.translateService.instant('admin.update-config.select.choose-file');
  }
}
