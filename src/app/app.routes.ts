import { Routes } from '@angular/router';
import { AsyncDemoComponent } from './async-subject/async-demo/async-demo.component';
import { BehaviorSubjectComponent } from './behavior-subject/behavior-subject.component';
import { ReplayDemoComponent } from './replay-subject/replay-demo/replay-demo.component';
import { ShoppingCartComponent } from './shopping-cart/shopping-cart.component';

export const routes: Routes = [
  { path: 'behavior', component: BehaviorSubjectComponent },
  { path: 'replay', component: ReplayDemoComponent },
  { path: 'async', component: AsyncDemoComponent },
  { path: 'shopping', component: ShoppingCartComponent },
  { path: '', redirectTo: 'behavior', pathMatch: 'full' },
  { path: '**', redirectTo: 'behavior' },
];
