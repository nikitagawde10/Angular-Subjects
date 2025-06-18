import { TestBed } from '@angular/core/testing';

import { AsyncSubjectService } from './async-subject.service';

describe('AsyncSubjectService', () => {
  let service: AsyncSubjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsyncSubjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
