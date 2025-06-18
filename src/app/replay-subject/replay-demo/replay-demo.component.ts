import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PublisherComponent } from '../publisher.component';
import { SubscriberComponent } from '../subscriber.component';

@Component({
  selector: 'app-replay-demo',
  imports: [PublisherComponent, SubscriberComponent],
  template: ` <div class="replay container border border-danger p-4">
    <app-publisher></app-publisher>
    <app-subscriber></app-subscriber>
  </div>`,
  styleUrl: './replay-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayDemoComponent {}
