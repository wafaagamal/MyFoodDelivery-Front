import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NgxsModule } from '@ngxs/store';

import { TrackingComponent } from './components/tracking/tracking.component';

const routes: Routes = [
  { path: ':orderId', component: TrackingComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TrackingComponent
  ],
  exports: [RouterModule]
})
export class TrackingModule { }
