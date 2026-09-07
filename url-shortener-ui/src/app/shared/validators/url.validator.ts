import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.trim();
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);
      const validProtocol = url.protocol === 'http:' || url.protocol === 'https:';
      if (!validProtocol) {
        return { urlInvalid: { message: 'URL must use http or https' } };
      }
      if (!url.hostname) {
        return { urlInvalid: { message: 'URL must have a valid hostname' } };
      }
      return null;
    } catch {
      return { urlInvalid: { message: 'Enter a valid URL' } };
    }
  };
}

export function customAliasValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.trim();
    if (!value) {
      return null;
    }
    const valid = /^[a-zA-Z0-9_-]{3,64}$/.test(value);
    return valid ? null : { aliasInvalid: { message: '3-64 chars, letters, numbers, - or _ only' } };
  };
}