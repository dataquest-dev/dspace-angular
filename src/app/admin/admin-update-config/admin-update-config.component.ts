import { Component, OnInit } from '@angular/core';
import { AdminUpdateConfigService, ConfigFile } from './admin-update-config.service';
import { Observable } from 'rxjs';
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
  fileContent: string = '';

  /**
   * Original file content for reset functionality
   */
  originalContent: string = '';

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
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadConfigFiles();
  }

  /**
   * Load available config files from /config/config-be/
   */
  loadConfigFiles(): void {
    this.loading = true;
    this.configService.getConfigFiles().subscribe({
      next: (files) => {
        this.configFiles = files;
        this.loading = false;
      },
      error: (error) => {

        this.loading = false;
        this.notificationsService.error(
          this.translateService.instant('admin.update-config.error.load-files.title'),
          this.translateService.instant('admin.update-config.error.load-files.message')
        );
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
      return;
    }

    this.selectedFile = file;
    this.loadFileContent(file.fileName);
  }

  /**
   * Load content of selected config file (instant loading!)
   */
  loadFileContent(filename: string): void {
    this.loading = true;

    // Instant subscription - no delays!
    this.configService.getConfigFileContent(filename).subscribe({
      next: (content) => {
        this.fileContent = content;
        this.originalContent = content;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.notificationsService.error('Load Failed', `Could not load ${filename}`);
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
   * Save the current config file to /config/config-be/
   */
  saveFile(): void {
    if (!this.selectedFile || this.saving) {
      return;
    }

    this.saving = true;

    this.configService.saveConfigFile(this.selectedFile.fileName, this.fileContent).subscribe({
      next: (result) => {
        this.saving = false;
        this.originalContent = this.fileContent;
        
        this.notificationsService.success(
          'File Saved Successfully!', 
          `${this.selectedFile?.fileName} has been updated successfully`
        );
        
        this.loadConfigFiles();
      },
      error: (error) => {
        this.saving = false;
        this.notificationsService.error(
          'Save Failed',
          `Could not save ${this.selectedFile?.fileName}`
        );
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
   * Reset to original file (reload from config/config-be/)
   */
  resetToOriginalFile(): void {
    if (!this.selectedFile) {
      return;
    }

    this.loading = true;
    
    this.configService.reloadOriginalContent(this.selectedFile.fileName).subscribe({
      next: (originalContent) => {
        this.fileContent = originalContent;
        this.originalContent = originalContent;
        this.loading = false;
        
        this.notificationsService.success(
          'File Reloaded!', 
          `Reloaded ${this.selectedFile?.fileName} from server`
        );
      },
      error: (error) => {
        this.loading = false;
        this.notificationsService.error('Reload Failed', 'Could not reload original file');
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