import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value ?? '';
    if (!value) {
      return null;
    }

    const checks = [
      { regex: /[a-z]/, message: 'a lowercase letter' },
      { regex: /[A-Z]/, message: 'an uppercase letter' },
      { regex: /\d/, message: 'a digit' },
      { regex: /[^a-zA-Z0-9\s]/, message: 'a symbol' },
    ];

    const missing = checks
      .filter(({ regex }) => !regex.test(value))
      .map(({ message }) => message)
      .filter((m) => m !== undefined);

    const errors: string[] = [];
    if (value.length < 12) {
      errors.push('at least 12 characters');
    }
    errors.push(...missing);

    if (errors.length === 0) {
      return null;
    }

    const last = errors.pop() ?? '';
    return { passwordStrength: { message: `Password must contain ${errors.length ? errors.join(', ') + ' and ' + last : last}` } };
  };
}
