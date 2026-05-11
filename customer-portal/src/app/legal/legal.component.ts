import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.scss']
})
export class LegalComponent implements OnInit {
  pageType: 'terms' | 'privacy' = 'terms';

  title = '';
  lastUpdated = 'May 10, 2026';

  sections: { heading: string; body: string }[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.pageType = this.route.snapshot.data['page'] ?? 'terms';
    if (this.pageType === 'privacy') {
      this.title = 'Privacy Policy';
      this.sections = [
        {
          heading: '1. Information We Collect',
          body: 'We collect information you provide when you register, place orders, or contact support, including your name, email address, phone number, delivery address, and payment details.'
        },
        {
          heading: '2. How We Use Your Information',
          body: 'We use your information to process orders, send order status notifications, improve our service, and communicate promotions. We will never sell your personal data to third parties.'
        },
        {
          heading: '3. Cookies',
          body: 'We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalise content. You can disable cookies in your browser settings at any time.'
        },
        {
          heading: '4. Data Retention',
          body: 'We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.'
        },
        {
          heading: '5. Security',
          body: 'We implement industry-standard security measures including HTTPS encryption and hashed password storage to protect your information. However, no method of transmission over the Internet is 100% secure.'
        },
        {
          heading: '6. Changes to This Policy',
          body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by a prominent notice on our website.'
        },
        {
          heading: '7. Contact Us',
          body: 'If you have questions about this Privacy Policy, please contact us at privacy@myfooddelivery.com.'
        }
      ];
    } else {
      this.title = 'Terms of Service';
      this.sections = [
        {
          heading: '1. Acceptance of Terms',
          body: 'By accessing or using MyFoodDelivery you agree to be bound by these Terms of Service. If you do not agree, please do not use our service.'
        },
        {
          heading: '2. Use of the Service',
          body: 'You must be at least 18 years old to use this service. You agree to provide accurate information and to keep your account credentials confidential. You are responsible for all activity that occurs under your account.'
        },
        {
          heading: '3. Orders & Payment',
          body: 'All orders placed through the platform are subject to restaurant availability. Prices are set by the restaurants. Payment is processed securely at the time of order placement.'
        },
        {
          heading: '4. Cancellations & Refunds',
          body: 'Orders may be cancelled before the restaurant confirms them. Once confirmed, cancellations are subject to the individual restaurant\'s policy. Refunds for undelivered or incorrect orders will be processed within 5-7 business days.'
        },
        {
          heading: '5. Intellectual Property',
          body: 'All content on the MyFoodDelivery platform, including logos, designs, and text, is the property of MyFoodDelivery or its licensors. You may not reproduce or distribute any content without written permission.'
        },
        {
          heading: '6. Limitation of Liability',
          body: 'MyFoodDelivery is not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount paid for the order giving rise to the claim.'
        },
        {
          heading: '7. Changes to Terms',
          body: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes your acceptance of the new terms.'
        },
        {
          heading: '8. Contact Us',
          body: 'For questions about these Terms, please contact us at legal@myfooddelivery.com.'
        }
      ];
    }
  }
}
