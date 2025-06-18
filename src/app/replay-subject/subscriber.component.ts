// src/app/replay-subject/subscriber.component.ts
import { Component, OnInit } from '@angular/core';
import { ReplaySubjectService } from './replay-subject.service';
import { CommonModule } from '@angular/common';
import { scan } from 'rxjs';

@Component({
  selector: 'app-subscriber',
  standalone: true,
  template: `
    <div class="container">
      <h4>Event History (last 3)</h4>
      <ul>
        <li *ngFor="let e of events">{{ e }}</li>
      </ul>
    </div>
  `,
  imports: [CommonModule],
})
export class SubscriberComponent implements OnInit {
  events: string[] = [];

  constructor(private svc: ReplaySubjectService) {}

  ngOnInit() {
    this.svc.history$
      .pipe(scan<string, string[]>((acc, e) => [...acc.slice(-2), e], []))
      .subscribe((arr) => {
        this.events = arr.reverse(); // always an array of up to 3 strings
      });
  }
}
