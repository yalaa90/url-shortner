import { Component, Input } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

export type SnackbarType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-shared-snackbar',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div class="snackbar-content" [attr.data-type]="type">
      <span class="snackbar-message">{{ message }}</span>
      <button mat-raised-button (click)="dismiss()" aria-label="Dismiss">
        Close
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
