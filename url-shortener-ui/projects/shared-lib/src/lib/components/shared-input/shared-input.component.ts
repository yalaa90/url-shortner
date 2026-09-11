import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-shared-input',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, ReactiveFormsModule, NgIf],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedInputComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [autocomplete]="autocomplete"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (loading) {
        <mat-spinner matSuffix diameter="20" />
      }
      @if (hint) {
        <mat-hint>{{ hint }}</mat-hint>
      }
      <mat-error *ngIf="errorMessage">{{ errorMessage }}</mat-error>
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .w-full {
        width: 100%;
      }
      mat-form-field {
        margin-bottom: 16px;
      }
    `,
  ],
})
export class SharedInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: string = 'text';
  @Input() placeholder = '';
  @Input() hint?: string;
  @Input() autocomplete?: string;
  @Input() errorMessage?: string;
  @Input() loading = false;
  value = '';

  private _disabled = false;

  get disabled(): boolean {
    return this._disabled;
  }

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }
}
