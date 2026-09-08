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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { authActions } from '../../../../state/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../../state/auth/auth.selectors';
import { SharedInputComponent } from '../../../../shared/components/shared-input/shared-input.component';
import { SharedButtonComponent } from '../../../../shared/components/shared-button/shared-button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    SharedInputComponent,
    SharedButtonComponent,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Welcome back</mat-card-title>
          <mat-card-subtitle>Sign in to manage your links</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form" novalidate>
            <app-shared-input
              formControlName="username"
              label="Email"
              type="email"
              autocomplete="username"
              [errorMessage]="fieldError('username')"
            />

            <app-shared-input
              formControlName="password"
              label="Password"
              type="password"
              autocomplete="current-password"
              [errorMessage]="fieldError('password')"
            />

            @if (error$ | async) {
              <mat-error class="form-error">
                Invalid credentials. Please try again.
              </mat-error>
            }

            <div class="form-actions">
              <app-shared-button
                label="Sign In"
                type="submit"
                [loading]="loading$ | async"
                [disabled]="loginForm.invalid"
              />
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions class="auth-actions">
          <a mat-button routerLink="/auth/register">Don't have an account? Create one</a>
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
        max-width: 420px;
        width: 100%;
        padding: 24px;
      }
      .auth-form {
        display: flex;
        flex-direction: column;
        margin-top: 16px;
      }
      .form-error {
        margin-bottom: 8px;
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
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  loginForm!: FormGroup;

  readonly loading$: Observable<boolean> = this.store.select(selectAuthLoading);
  readonly error$: Observable<unknown> = this.store.select(selectAuthError);

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    this.store.dispatch(
      authActions.loginRequest({
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
      })
    );
  }

  fieldError(field: string): string | undefined {
    const control = this.loginForm.get(field);
    if (!control || !control.touched || !control.errors) {
      return undefined;
    }
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address';
    }
    return undefined;
  }
}
