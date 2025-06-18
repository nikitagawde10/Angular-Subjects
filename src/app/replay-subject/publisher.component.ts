// src/app/replay-subject/publisher.component.ts
import { Component } from '@angular/core';
import { ReplaySubjectService } from './replay-subject.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-publisher',
  template: `
    <div class="container">
      <h1>Replay Subject</h1>
      <h4>Event Publisher</h4>
      <input [(ngModel)]="eventText" placeholder="Type event..." />
      <button class="btn btn-info" (click)="publish()">Publish</button>
    </div>
  `,
  imports: [FormsModule, CommonModule],
})
export class PublisherComponent {
  eventText = '';
  constructor(private svc: ReplaySubjectService) {}

  publish() {
    if (this.eventText.trim()) {
      this.svc.addEvent(this.eventText.trim());
      this.eventText = '';
    }
  }
}
