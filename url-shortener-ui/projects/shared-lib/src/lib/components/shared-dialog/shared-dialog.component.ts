import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface DialogData {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  danger?: boolean;
}

@Component({
  selector: 'app-shared-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    @if (data.message) {
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
    }
    <mat-dialog-actions align="end">
      @if (!data.hideCancel) {
        <button mat-button (click)="dialogRef.close(false)">
          {{ data.cancelLabel ?? 'Cancel' }}
        </button>
      }
      <button
        mat-raised-button
        [color]="data.danger ? 'warn' : 'primary'"
        (click)="dialogRef.close(true)"
      >
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class SharedDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SharedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
}
