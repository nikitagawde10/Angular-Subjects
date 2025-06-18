import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PublisherComponent } from '../publisher.component';
import { SubscriberComponent } from '../subscriber.component';

@Component({
  selector: 'app-async-demo',
  imports: [PublisherComponent, SubscriberComponent],
  template: ` <div class="async container border border-danger p-4">
    <app-async-publisher></app-async-publisher>
    <app-async-subscriber></app-async-subscriber>
  </div>`,
  styleUrl: './async-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsyncDemoComponent {}
