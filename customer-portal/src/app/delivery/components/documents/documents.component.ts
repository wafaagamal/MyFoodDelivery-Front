import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface RiderDoc {
  id: string;
  name: string;
  icon: string;
  status: 'verified' | 'pending' | 'expired' | 'missing';
  expiryDate?: string;
}

@Component({
  selector: 'app-delivery-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DeliveryDocumentsComponent implements OnInit {
  documents: RiderDoc[] = [
    { id: 'license', name: "Driver's License", icon: 'fa-id-card', status: 'verified', expiryDate: '2027-03-15' },
    { id: 'insurance', name: 'Vehicle Insurance', icon: 'fa-shield-alt', status: 'verified', expiryDate: '2026-12-01' },
    { id: 'registration', name: 'Vehicle Registration', icon: 'fa-file-alt', status: 'pending' },
    { id: 'profile_photo', name: 'Profile Photo', icon: 'fa-portrait', status: 'verified' },
    { id: 'background', name: 'Background Check', icon: 'fa-user-check', status: 'pending' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      verified: 'Verified', pending: 'Pending Review',
      expired: 'Expired', missing: 'Upload Required'
    };
    return map[status] ?? status;
  }

  uploadDocument(doc: RiderDoc): void {
    // placeholder for upload flow
    alert(`Upload for "${doc.name}" — coming soon`);
  }

  goBack(): void {
    this.router.navigate(['/delivery/home']);
  }
}
