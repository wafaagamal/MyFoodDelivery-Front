import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryService } from '../../services/delivery.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './earnings.component.html',
  styleUrls: ['./earnings.component.scss']
})
export class EarningsComponent implements OnInit {
  activePeriod: 'day' | 'week' | 'month' = 'week';
  loading = false;

  periods: { label: string; value: 'day' | 'week' | 'month' }[] = [
    { label: 'Today', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' }
  ];

  totalEarnings = 0;
  totalDeliveries = 0;
  totalTips = 0;
  activeHours = 0;
  avgPerDelivery = 0;
  availableBalance = 0;

  dailyData: { label: string; amount: number }[] = [];
  transactions: { type: string; title: string; date: string; amount: number }[] = [];

  constructor(
    private deliveryService: DeliveryService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadEarnings();
  }

  changePeriod(period: 'day' | 'week' | 'month'): void {
    this.activePeriod = period;
    this.loadEarnings();
  }

  loadEarnings(): void {
    this.loading = true;

    this.deliveryService.getEarnings(this.activePeriod).subscribe({
      next: data => {
        this.totalEarnings = data.totalEarnings;
        this.totalDeliveries = data.totalDeliveries;
        this.totalTips = data.totalTips;
        this.activeHours = data.activeHours;
        this.avgPerDelivery = data.avgPerDelivery;
        this.availableBalance = data.availableBalance;
      },
      error: () => this.toast.error('Failed to load earnings summary.')
    });

    this.deliveryService.getDailyEarnings(this.activePeriod).subscribe({
      next: data => {
        this.dailyData = data.map(d => ({ label: d.day, amount: d.earnings }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.deliveryService.getTransactions(this.activePeriod).subscribe({
      next: txns => {
        this.transactions = txns.map(t => ({
          type: t.type === 'withdrawal' ? 'withdrawal' : 'earning',
          title: t.description,
          date: new Date(t.date).toLocaleString(),
          amount: t.amount
        }));
      },
      error: () => {}
    });
  }

  get maxDaily(): number {
    if (this.dailyData.length === 0) return 1;
    return Math.max(...this.dailyData.map(d => d.amount), 1);
  }

  withdraw(): void {
    this.toast.warning('Withdrawal feature coming soon. Please contact support.');
  }
}

