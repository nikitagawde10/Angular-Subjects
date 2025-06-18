// src/app/async-subject/subscriber.component.ts
import { Component, OnInit } from '@angular/core';
import { AsyncSubjectService } from './async-subject.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-async-subscriber',
  template: `
    <div class="container">
      <h4>Result:</h4>
      <div *ngIf="result !== null; else waiting">
        <strong>{{ result }}</strong>
      </div>
      <ng-template #waiting>
        <em>Waiting for completion…</em>
      </ng-template>
    </div>
  `,
  imports: [CommonModule],
})
export class SubscriberComponent implements OnInit {
  result: number | null = null;

  constructor(private svc: AsyncSubjectService) {}

  ngOnInit() {
    this.svc.result$.subscribe({
      next: (val) => (this.result = val),
      complete: () => console.log('Calculation complete'),
    });
  }
}
