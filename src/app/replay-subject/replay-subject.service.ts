// src/app/replay-subject/replay-subject.service.ts
import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReplaySubjectService {
  // BufferSize = 3 → new subscribers get the last 3 values immediately
  private historySubject = new ReplaySubject<string>(3);
  public history$: Observable<string> = this.historySubject.asObservable();

  addEvent(event: string) {
    this.historySubject.next(event);
  }
}
