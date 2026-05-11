import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cart-container">
      <h1>Your Cart</h1>
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <a routerLink="/customer/restaurants" class="browse-btn">Browse Restaurants</a>
      </div>
    </div>
  `,
  styles: [`
    .cart-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      margin: 0 0 32px 0;
      font-size: 28px;
      font-weight: 700;
    }
    .empty-cart {
      text-align: center;
      padding: 60px 20px;
      background: #f9f9f9;
      border-radius: 16px;
    }
    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .empty-cart h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #333;
    }
    .empty-cart p {
      color: #666;
      margin: 0 0 24px 0;
    }
    .browse-btn {
      display: inline-block;
      padding: 14px 32px;
      background: #ff6b6b;
      color: white;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .browse-btn:hover {
      background: #e55a5a;
    }
  `]
})
export class CartComponent {}
