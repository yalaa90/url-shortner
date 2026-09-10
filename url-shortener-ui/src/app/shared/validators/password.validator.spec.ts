import { FormControl } from '@angular/forms';
import { passwordValidator } from './password.validator';

describe('passwordValidator', () => {
  let validator: ReturnType<typeof passwordValidator>;

  beforeEach(() => {
    validator = passwordValidator();
  });

  it('treats an empty value as valid', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('accepts a sufficiently strong password', () => {
    expect(validator(new FormControl('Str0ng!Password'))).toBeNull();
  });

  it('flags too-short passwords', () => {
    const result = validator(new FormControl('S0rt!x')) as { passwordStrength: { message: string } };
    expect(result.passwordStrength.message).toContain('at least 12 characters');
  });

  it('flags missing lowercase letters', () => {
    const result = validator(new FormControl('UPPERCASE1!PASS')) as { passwordStrength: { message: string } };
    expect(result.passwordStrength.message).toContain('a lowercase letter');
  });

  it('flags missing uppercase letters', () => {
    const result = validator(new FormControl('lowercase1!pass')) as { passwordStrength: { message: string } };
    expect(result.passwordStrength.message).toContain('an uppercase letter');
  });

  it('flags missing digits', () => {
    const result = validator(new FormControl('LowercaseSymbols!')) as { passwordStrength: { message: string } };
    expect(result.passwordStrength.message).toContain('a digit');
  });

  it('flags missing symbols', () => {
    const result = validator(new FormControl('LowercaseDigits123')) as { passwordStrength: { message: string } };
    expect(result.passwordStrength.message).toContain('a symbol');
  });

  it('combines all missing requirements in one message', () => {
    const result = validator(new FormControl('weak')) as { passwordStrength: { message: string } };
    expect(result.passwordStrength.message).toContain('at least 12 characters');
    expect(result.passwordStrength.message).toContain('a digit');
    expect(result.passwordStrength.message).toContain('a symbol');
  });
});