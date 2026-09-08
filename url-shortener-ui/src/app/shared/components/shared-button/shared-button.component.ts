import { Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

@Component({
  selector: 'app-shared-button',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, NgClass],
  template: `
    <button
      mat-raised-button
      [attr.type]="type"
      [disabled]="disabled || loading"
      [class.is-loading]="loading"
      [ngClass]="'variant-' + variant"
      class="shared-button"
      (click)="onClick.emit($event)"
      [attr.aria-label]="ariaLabel ?? label"
      [attr.aria-busy]="loading"
    >
      @if (loading) {
        <mat-spinner diameter="18" strokeWidth="2" />
      }
      <span>{{ label }}</span>
    </button>
  `,
  styles: [
    `
      .shared-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 120px;
        justify-content: center;
      }

      .shared-button.is-loading {
        pointer-events: none;
      }

      .variant-outline {
        background: transparent;
        border: 1px solid var(--mat-button-outline-ripple-color, rgba(0, 0, 0, 0.23));
      }

      .variant-danger {
        background: var(--sys-error, #b3261e);
        color: white;
      }
    `,
  ],
})
export class SharedButtonComponent {
  @Input() label = '';
  @Input() type: 'button' | 'submit' = 'button';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;
  @Input() variant: ButtonVariant = 'primary';
  @Input() ariaLabel?: string;
  @Output() onClick = new EventEmitter<Event>();
}
