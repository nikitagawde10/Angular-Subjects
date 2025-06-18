// src/app/async-subject/publisher.component.ts
import { Component } from '@angular/core';
import { AsyncSubjectService } from './async-subject.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-async-publisher',
  template: `
    <div class="container">
      <h1>AsyncSubject Demo</h1>
      <p>Enter numbers (comma-separated):</p>
      <input [(ngModel)]="inputText" placeholder="e.g. 1,2,3,4" />
      <button class="btn btn-success" (click)="calculate()">Calculate</button>
      <button class="btn btn-dark ml-20" (click)="reset()">Reset</button>
    </div>
  `,
  imports: [FormsModule, CommonModule],
})
export class PublisherComponent {
  inputText = '';

  constructor(private svc: AsyncSubjectService) {}

  calculate() {
    const nums = this.inputText
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    this.svc.runCalculation(nums);
  }

  reset() {
    this.svc.reset();
  }
}
