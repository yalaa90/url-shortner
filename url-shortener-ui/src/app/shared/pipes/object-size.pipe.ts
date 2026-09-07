import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'objectSize', standalone: true })
export class ObjectSizePipe implements PipeTransform {
  transform(value: Record<string, unknown> | null | undefined): number {
    return value ? Object.keys(value).length : 0;
  }
}