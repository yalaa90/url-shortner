import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { Observable, filter } from 'rxjs';
import { linkActions } from '../../../../state/links/link.actions';
import { selectLastCreatedLink, selectLinksCreating } from '../../../../state/links/link.selectors';
import {
  SharedInputComponent,
  SharedButtonComponent,
  CopyToClipboardComponent,
  ShortLink,
  urlValidator,
  customAliasValidator,
} from '@shared-lib';
import QRCode from 'qrcode';

@Component({
  selector: 'app-link-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    SharedInputComponent,
    SharedButtonComponent,
    CopyToClipboardComponent,
  ],
  template: `
    <div class="create-page">
      <header class="page-header">
        <div>
          <h1>Create Short Link</h1>
          <p class="subtitle">Shorten any URL with an optional custom alias.</p>
        </div>
        <a mat-button routerLink="/links" aria-label="Back to links">
          Back
        </a>
      </header>

      @if (!createdLink) {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="createForm" (ngSubmit)="onSubmit()" novalidate>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Destination URL</mat-label>
                <input matInput formControlName="url" placeholder="https://example.com/long/path" />
                <mat-hint>Must start with http:// or https://</mat-hint>
                <mat-error *ngIf="getError('url', 'required')">URL is required</mat-error>
                <mat-error *ngIf="getError('url', 'urlInvalid')">{{ urlErrorMessage }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Custom Alias (optional)</mat-label>
                <input matInput formControlName="customAlias" placeholder="my-custom-alias" />
                <mat-hint>3&ndash;64 characters: letters, numbers, &ndash; or _</mat-hint>
                <mat-error *ngIf="getError('customAlias', 'aliasInvalid')">Alias format is invalid</mat-error>
                <mat-error *ngIf="getError('customAlias', 'aliasTaken')">This alias is already taken</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Expiration date (optional)</mat-label>
                <input matInput formControlName="expiresAt" type="date" [min]="tomorrowLocal" />
                <mat-hint>Date after which the link stops redirecting.</mat-hint>
              </mat-form-field>

              <div class="form-actions">
                <app-shared-button
                  label="Create Link"
                  type="submit"
                  [loading]="creating$ | async"
                  [disabled]="createForm.invalid || (creating$ | async)"
                />
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card class="success-card">
          <mat-card-header>
            <mat-card-title>Your link is ready!</mat-card-title>
            <mat-card-subtitle>Copy it or view analytics.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="short-url-preview">
              <a [href]="createdLink.shortUrl" target="_blank" rel="noopener">
                {{ createdLink.shortUrl }}
              </a>
              <app-copy-to-clipboard [text]="createdLink.shortUrl"></app-copy-to-clipboard>
            </div>
            <div class="qr-box">
              <img [src]="qrCode" alt="QR code for short link" />
            </div>
            <div class="success-actions">
              <a mat-raised-button color="primary" [routerLink]="['/links', createdLink.shortCode]">
                View Details
              </a>
              <button mat-stroked-button (click)="resetForm()" type="button">
                Create another
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .subtitle { color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6)); margin: 0; }
    .full-width { width: 100%; margin-bottom: 16px; }
    .form-actions { display: flex; justify-content: flex-end; }
    .success-card { max-width: 520px; margin: 0 auto; }
    .short-url-preview { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; margin: 16px 0; padding: 12px; background: rgba(0, 0, 0, 0.04); border-radius: 8px; }
    .short-url-preview a { flex: 1; text-decoration: none; word-break: break-all; color: var(--sys-primary, #6750a4); }
    .success-actions { display: flex; gap: 12px; margin-top: 16px; }
    .qr-box img { width: 160px; height: 160px; border-radius: 8px; border: 1px solid rgba(0, 0, 0, 0.12); }
  `],
})
export class LinkCreateComponent implements OnInit {
  createForm!: FormGroup;
  createdLink: ShortLink | null = null;
  qrCode = '';

  get tomorrowLocal(): string {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  urlErrorMessage = '';

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  readonly creating$: Observable<boolean> = this.store.select(selectLinksCreating);

  ngOnInit(): void {
    this.createForm = this.fb.group({
      url: ['', [Validators.required, urlValidator()]],
      customAlias: ['', { validators: [customAliasValidator()] }],
      expiresAt: [null],
    });

    this.store
      .select(selectLastCreatedLink)
      .pipe(filter((link): link is ShortLink => !!link))
      .subscribe((link) => {
        this.createdLink = link;
        void QRCode.toDataURL(link.shortUrl, { width: 320, margin: 1 }).then(
          (dataUrl) => (this.qrCode = dataUrl)
        );
      });
  }

  onSubmit(): void {
    if (this.createForm.invalid) {
      return;
    }
    const payload = {
      url: this.createForm.value.url.trim(),
      customAlias: this.createForm.value.customAlias?.trim() || undefined,
      expiresAt: this.createForm.value.expiresAt
        ? new Date(`${this.createForm.value.expiresAt}T00:00:00`).toISOString()
        : undefined,
    };
    this.store.dispatch(linkActions.createLink({ payload }));
  }

  getError(field: string, errorCode: string): boolean {
    const control = this.createForm.get(field);
    return !!control?.hasError(errorCode);
  }

  resetForm(): void {
    this.createdLink = null;
    this.qrCode = '';
    this.createForm.reset();
  }
}