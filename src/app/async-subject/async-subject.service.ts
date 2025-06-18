// src/app/async-subject/async-subject.service.ts
import { Injectable } from '@angular/core';
import { AsyncSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AsyncSubjectService {
  private resultSubject = new AsyncSubject<number>();

  /** Expose as observable */
  result$: Observable<number> = this.resultSubject.asObservable();

  /** Simulate a long-running calculation */
  runCalculation(inputs: number[]) {
    let total = 0;
    for (const n of inputs) {
      total += n; // emit intermediate if you want...
      // you could call this.resultSubject.next(total);
    }

    // finally, push the “final” result:
    this.resultSubject.next(total);
    // and complete—this is when subscribers get the value:
    this.resultSubject.complete();
  }

  /** Reset if you need to run again */
  reset() {
    this.resultSubject = new AsyncSubject<number>();
    this.result$ = this.resultSubject.asObservable();
  }
}
