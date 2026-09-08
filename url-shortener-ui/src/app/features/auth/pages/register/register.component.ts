import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppConfigService } from '../../../../core/services/app-config.service';
import { SharedInputComponent } from '../../../../shared/components/shared-input/shared-input.component';
import { SharedButtonComponent } from '../../../../shared/components/shared-button/shared-button.component';
import { passwordValidator } from '../../../../shared/validators/password.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    SharedInputComponent,
    SharedButtonComponent,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Create an account</mat-card-title>
          <mat-card-subtitle>Your identity is provisioned by the identity provider</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
            <app-shared-input
              formControlName="email"
              label="Email"
              type="email"
              autocomplete="email"
              [errorMessage]="fieldError('email')"
            />

            <app-shared-input
              formControlName="password"
              label="Password"
              type="password"
              autocomplete="new-password"
              hint="At least 12 characters, with upper, lower, digit and symbol."
              [errorMessage]="fieldError('password')"
            />

            <app-shared-input
              formControlName="confirmPassword"
              label="Confirm Password"
              type="password"
              autocomplete="new-password"
              [errorMessage]="fieldError('confirmPassword')"
            />

            <div class="form-actions">
              <app-shared-button
                label="Create Account"
                type="submit"
                [disabled]="registerForm.invalid"
              />
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions class="auth-actions">
          <a mat-button routerLink="/auth/login">Already have an account? Sign in</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-page {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--mat-toolbar-container-background-color), #1a1a2e);
        padding: 16px;
      }
      .auth-card {
        max-width: 460px;
        width: 100%;
        padding: 24px;
      }
      .auth-form {
        display: flex;
        flex-direction: column;
        margin-top: 16px;
      }
      .form-actions {
        margin-top: 8px;
      }
      .auth-actions {
        justify-content: center;
        padding-bottom: 12px;
      }
    `,
  ],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly config = inject(AppConfigService);

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, passwordValidator()]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.matchValidator }
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const email = this.registerForm.value.email;
    this.snackBar.open(
      `Account provisioning requested for ${email}. Check your inbox for an activation link.`,
      'Dismiss',
      { duration: 6000 }
    );
    this.config.registerRedirectUrl()
      ? window.open(this.config.registerRedirectUrl(), '_blank', 'noopener')
      : this.registerForm.reset();
  }

  private matchValidator(group: FormGroup): { passwordsMismatch: true } | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  fieldError(field: string): string | undefined {
    const control = this.registerForm.get(field);
    if (!control || !control.touched || !control.errors) {
      return undefined;
    }
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address';
    }
    if (control.hasError('passwordStrength')) {
      return control.getError('passwordStrength').message;
    }
    if (control.hasError('passwordsMismatch')) {
      return 'Passwords do not match';
    }
    return undefined;
  }
}
