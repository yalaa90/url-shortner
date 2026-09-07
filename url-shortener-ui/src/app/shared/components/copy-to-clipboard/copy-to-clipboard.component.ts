import { Component, Input, booleanAttribute } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-copy-to-clipboard',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      [disabled]="disabled"
      (click)="copy()"
      matTooltip="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      <mat-icon [fontIcon]="copied ? 'check_circle' : 'content_copy'"></mat-icon>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
      }
    `,
  ],
})
export class CopyToClipboardComponent {
  @Input() text = '';
  @Input({ transform: booleanAttribute }) disabled = false;

  copied = false;

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      this.fallbackCopy();
    }
  }

  private fallbackCopy(): void {
    const textarea = document.createElement('textarea');
    textarea.value = this.text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }
}