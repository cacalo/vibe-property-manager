import { Injectable, inject, effect } from '@angular/core';
import { PropertyService } from './property.service';
import { ExportService } from './export.service';
import { ImportService, ImportResult } from './import.service';

export interface BackupData {
  properties: any[];
  revenues: any[];
  expenses: any[];
  metadata: {
    version: string;
    createdAt: string;
    totalProperties: number;
    totalRevenues: number;
    totalExpenses: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private readonly propertyService = inject(PropertyService);
  private readonly exportService = inject(ExportService);
  private readonly importService = inject(ImportService);

  private readonly BACKUP_VERSION = '1.0.0';
  private readonly STORAGE_KEY = 'vibe_auto_backup';

  /**
   * Create a complete backup of all data
   */
  createBackup(): BackupData {
    const properties = this.propertyService.properties();
    const revenues = this.propertyService.revenues();
    const expenses = this.propertyService.expenses();

    return {
      properties,
      revenues,
      expenses,
      metadata: {
        version: this.BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        totalProperties: properties.length,
        totalRevenues: revenues.length,
        totalExpenses: expenses.length
      }
    };
  }

  /**
   * Export backup to file
   */
  exportBackup(): void {
    const backup = this.createBackup();
    const filename = `vibe-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    window.URL.revokeObjectURL(url);
  }

  /**
   * Restore backup from backup data
   */
  async restoreBackup(backupData: BackupData): Promise<ImportResult> {
    try {
      // Validate backup format
      if (!this.validateBackupFormat(backupData)) {
        return {
          success: false,
          message: 'Invalid backup format',
          importedCount: 0,
          errors: ['Backup file format is not recognized']
        };
      }

      // Clear existing data if user confirms
      const shouldClear = confirm(
        'Restoring backup will replace all existing data. Are you sure you want to continue?'
      );
      
      if (!shouldClear) {
        return {
          success: false,
          message: 'Restore cancelled by user',
          importedCount: 0,
          errors: []
        };
      }

      // Clear existing data
      this.propertyService.clearAllData();

      // Import the backup data
      const jsonContent = JSON.stringify(backupData);
      const result = await this.importService.importBackupFromJSON(jsonContent);

      if (result.success) {
        this.saveAutoBackup(backupData);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        importedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Create automatic backup to localStorage
   */
  createAutoBackup(): void {
    try {
      const backup = this.createBackup();
      this.saveAutoBackup(backup);
    } catch (error) {
      console.warn('Failed to create auto backup:', error);
    }
  }

  /**
   * Restore from automatic backup
   */
  async restoreAutoBackup(): Promise<ImportResult> {
    try {
      const backupData = this.getAutoBackup();
      if (!backupData) {
        return {
          success: false,
          message: 'No automatic backup found',
          importedCount: 0,
          errors: []
        };
      }

      return await this.restoreBackup(backupData);
    } catch (error) {
      return {
        success: false,
        message: `Auto restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        importedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get information about available automatic backup
   */
  getAutoBackupInfo(): { hasBackup: boolean; metadata?: any } {
    try {
      const backup = this.getAutoBackup();
      return {
        hasBackup: !!backup,
        metadata: backup?.metadata
      };
    } catch {
      return { hasBackup: false };
    }
  }

  /**
   * Delete automatic backup
   */
  clearAutoBackup(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear auto backup:', error);
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleAutoBackup(): void {
    // Create backup when data changes using effects
    effect(() => {
      // These calls will track changes to the signals
      this.propertyService.properties();
      this.propertyService.revenues();
      this.propertyService.expenses();
      
      // Schedule backup with delay
      this.scheduleBackupWithDelay();
    });
  }

  private scheduleBackupWithDelay(): void {
    // Debounce backup creation to avoid too frequent backups
    clearTimeout((this as any).backupTimeout);
    (this as any).backupTimeout = setTimeout(() => {
      this.createAutoBackup();
    }, 5000); // 5 second delay
  }

  private validateBackupFormat(data: any): data is BackupData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.properties) &&
      Array.isArray(data.revenues) &&
      Array.isArray(data.expenses) &&
      data.metadata &&
      typeof data.metadata === 'object' &&
      data.metadata.version
    );
  }

  private saveAutoBackup(backup: BackupData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backup));
    } catch (error) {
      console.warn('Failed to save auto backup:', error);
    }
  }

  private getAutoBackup(): BackupData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const backup = JSON.parse(stored);
      return this.validateBackupFormat(backup) ? backup : null;
    } catch {
      return null;
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats(): { 
    autoBackupSize: number; 
    autoBackupAge: string | null;
    canRestore: boolean;
  } {
    const autoBackup = this.getAutoBackup();
    
    if (!autoBackup) {
      return {
        autoBackupSize: 0,
        autoBackupAge: null,
        canRestore: false
      };
    }

    const sizeInBytes = new Blob([JSON.stringify(autoBackup)]).size;
    const ageMs = Date.now() - new Date(autoBackup.metadata.createdAt).getTime();
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    
    let ageString = '';
    if (ageMinutes < 1) {
      ageString = 'Just now';
    } else if (ageMinutes < 60) {
      ageString = `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
    } else {
      const ageHours = Math.floor(ageMinutes / 60);
      if (ageHours < 24) {
        ageString = `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
      } else {
        const ageDays = Math.floor(ageHours / 24);
        ageString = `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
      }
    }

    return {
      autoBackupSize: sizeInBytes,
      autoBackupAge: ageString,
      canRestore: true
    };
  }
}
