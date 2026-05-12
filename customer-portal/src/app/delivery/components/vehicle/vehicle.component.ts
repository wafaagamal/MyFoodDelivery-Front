import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-delivery-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle.component.html',
  styleUrls: ['./vehicle.component.scss']
})
export class DeliveryVehicleComponent implements OnInit {
  vehicle = {
    type: 'Motorcycle',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    insuranceExpiry: ''
  };

  vehicleTypes = ['Bicycle', 'Motorcycle', 'Car', 'Scooter', 'Van'];
  todayStr = new Date().toISOString().split('T')[0];
  editing = false;
  saving = false;

  constructor(
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  toggleEdit(): void {
    this.editing = !this.editing;
  }

  save(): void {
    this.saving = true;
    setTimeout(() => {
      this.saving = false;
      this.editing = false;
      this.toastService.show('Vehicle info updated', 'success');
    }, 800);
  }

  goBack(): void {
    this.router.navigate(['/delivery/home']);
  }
}
