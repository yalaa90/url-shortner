import { Injectable } from '@angular/core';
import { AsyncValidator, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, first } from 'rxjs/operators';
import { LinkApiService } from '../../core/services/link-api.service';

@Injectable({ providedIn: 'root' })
export class AliasAsyncValidator implements AsyncValidator {
  constructor(private readonly linkApi: LinkApiService) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const alias = control.value?.trim();
    if (!alias) {
      return of(null);
    }

    if (!/^[a-zA-Z0-9_-]{3,64}$/.test(alias)) {
      return of({ aliasInvalid: true });
    }

    return timer(300).pipe(
      switchMap(() => this.linkApi.checkAlias(alias)),
      map((response) =>
        response.data.available ? null : { aliasTaken: { alias } }
      ),
      first()
    );
  }
}