import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'resolved';
  date: string;
}

@Component({
  selector: 'app-delivery-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class DeliverySupportComponent {
  tickets: SupportTicket[] = [
    { id: 'TKT-001', subject: 'Payment delay for order ORD-2345', status: 'resolved', date: '2026-05-10' },
    { id: 'TKT-002', subject: 'App crashed during delivery', status: 'open', date: '2026-05-12' }
  ];

  newTicket = { subject: '', message: '' };
  showNewTicketForm = false;
  submitting = false;

  faqs = [
    { q: 'How do I get paid?', a: 'Payments are processed weekly every Monday and transferred to your registered bank account.', open: false },
    { q: 'What if a customer is not home?', a: 'Wait up to 5 minutes, then contact support. You will still receive the delivery fee.', open: false },
    { q: 'How is my rating calculated?', a: 'Your rating is an average of the last 100 customer reviews. Maintain above 4.0 to stay active.', open: false },
    { q: 'How do I report a road incident?', a: 'Use the Report Issue button in the active delivery screen immediately after the incident.', open: false }
  ];

  constructor(
    private toastService: ToastService,
    private router: Router
  ) {}

  toggleFaq(faq: any): void {
    faq.open = !faq.open;
  }

  submitTicket(): void {
    if (!this.newTicket.subject.trim() || !this.newTicket.message.trim()) {
      this.toastService.show('Please fill in all fields', 'error');
      return;
    }
    this.submitting = true;
    setTimeout(() => {
      this.tickets.unshift({
        id: `TKT-${String(this.tickets.length + 1).padStart(3, '0')}`,
        subject: this.newTicket.subject,
        status: 'open',
        date: new Date().toISOString().split('T')[0]
      });
      this.newTicket = { subject: '', message: '' };
      this.showNewTicketForm = false;
      this.submitting = false;
      this.toastService.show('Support ticket submitted', 'success');
    }, 800);
  }

  goBack(): void {
    this.router.navigate(['/delivery/home']);
  }
}
