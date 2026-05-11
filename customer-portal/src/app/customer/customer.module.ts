import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxsModule } from '@ngxs/store';

import { CustomerState } from './state/customer.state';
import { ProfileComponent } from './components/profile/profile.component';
import { AddressManagementComponent } from './components/address-management/address-management.component';

const routes: Routes = [
  { path: 'profile', component: ProfileComponent },
  { path: 'addresses', component: AddressManagementComponent },
  { path: '', redirectTo: 'profile', pathMatch: 'full' }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    NgxsModule.forFeature([CustomerState]),
    // Standalone components
    ProfileComponent,
    AddressManagementComponent
  ],
  exports: [RouterModule]
})
export class CustomerModule { }
