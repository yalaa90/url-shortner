import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedDialogComponent, DialogData } from './shared-dialog.component';

describe('SharedDialogComponent', () => {
  let fixture: ComponentFixture<SharedDialogComponent>;
  let component: SharedDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<SharedDialogComponent>>;

  function setup(data: DialogData): void {
    dialogRef = jasmine.createSpyObj<MatDialogRef<SharedDialogComponent>>('MatDialogRef', [
      'close',
    ]);
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SharedDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    fixture = TestBed.createComponent(SharedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders the title, message and action labels', () => {
    setup({
      title: 'Deactivate link?',
      message: 'This link will stop working.',
      confirmLabel: 'Yes',
      cancelLabel: 'No',
    });

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Deactivate link?');
    expect(el.textContent).toContain('This link will stop working.');
    expect(el.textContent).toContain('Yes');
    expect(el.textContent).toContain('No');
  });

  it('closes with true on confirm and false on cancel', () => {
    setup({ title: 'Question', confirmLabel: 'OK' });

    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith(false);

    (buttons[1] as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('hides the cancel button and omits the message when configured', () => {
    setup({ title: 'Only confirm', hideCancel: true });

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('button').length).toBe(1);
    expect(el.textContent).not.toContain('Cancel');
    expect(component.data.message).toBeUndefined();
  });

  it('uses the danger colour hint', () => {
    setup({ title: 'Delete', danger: true });
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const confirm = buttons[buttons.length - 1] as HTMLElement;
    expect(confirm.classList.contains('mat-warn')).toBe(true);
  });
});