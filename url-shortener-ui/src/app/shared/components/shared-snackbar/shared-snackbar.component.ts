import { Component, Input } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type SnackbarType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-shared-snackbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="snackbar-content" [attr.data-type]="type">
      @if (type === 'success') {
        <mat-icon fontIcon="check_circle"></mat-icon>
      } @else if (type === 'error') {
        <mat-icon fontIcon="error"></mat-icon>
      } @else {
        <mat-icon fontIcon="info"></mat-icon>
      }
      <span class="snackbar-message">{{ message }}</span>
      <button mat-icon-button (click)="dismiss()" aria-label="Dismiss">
        <mat-icon fontIcon="close"></mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .snackbar-content {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      .snackbar-message {
        flex: 1;
      }
    `,
  ],
})
export class SharedSnackbarComponent {
  @Input() message = '';
  @Input() type: SnackbarType = 'info';

  constructor(private readonly snackbarRef: MatSnackBarRef<SharedSnackbarComponent>) {}

  dismiss(): void {
    this.snackbarRef.dismiss();
  }
}