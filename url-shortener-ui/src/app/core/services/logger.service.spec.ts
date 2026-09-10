import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('logs at all levels when the level is debug', () => {
    const debug = spyOn(console, 'debug');
    const info = spyOn(console, 'info');
    const warn = spyOn(console, 'warn');
    const error = spyOn(console, 'error');

    service.debug('d');
    service.info('i');
    service.warn('w');
    service.error('e');

    expect(debug).toHaveBeenCalledWith('[DEBUG]', 'd');
    expect(info).toHaveBeenCalledWith('[INFO]', 'i');
    expect(warn).toHaveBeenCalledWith('[WARN]', 'w');
    expect(error).toHaveBeenCalledWith('[ERROR]', 'e');
  });

  it('suppresses lower-priority levels after raising the threshold', () => {
    const debug = spyOn(console, 'debug');
    const info = spyOn(console, 'info');
    const warn = spyOn(console, 'warn');
    const error = spyOn(console, 'error');

    service.setLevel('warn');
    service.debug('d');
    service.info('i');
    service.warn('w');
    service.error('e');

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });

  it('only logs errors at the error level', () => {
    const error = spyOn(console, 'error');
    service.setLevel('error');
    service.warn('w');
    service.error('e');
    expect(error).not.toHaveBeenCalledWith('[WARN]', 'w');
    expect(error).toHaveBeenCalledWith('[ERROR]', 'e');
  });
});