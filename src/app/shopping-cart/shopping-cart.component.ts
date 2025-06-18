import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from './services/cart.service';
import { CouponService } from './services/coupon.service';
import { NotificationService } from './services/notification.service';
import { UserService } from './services/user.service';
import {
  User,
  NotificationMessage,
  Product,
  CartSummary,
  sampleProducts,
} from './shopping-cart.utils';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css'],
  imports: [CommonModule, FormsModule],
})
export class ShoppingCartComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cartSummary: CartSummary = {} as CartSummary;
  user: User | null = null;
  notification: NotificationMessage | null = null;
  cartValueAlert = '';
  cartExpiryWarning = '';
  products: Product[] = sampleProducts;
  constructor(
    private cartService: CartService,
    private userService: UserService,
    private couponService: CouponService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Subscribe to all observables
    this.cartService.cartSummary$
      .pipe(takeUntil(this.destroy$))
      .subscribe((summary) => (this.cartSummary = summary));

    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => (this.user = user));

    this.notificationService.notification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => (this.notification = notification));

    this.notificationService.cartValueAlert$
      .pipe(takeUntil(this.destroy$))
      .subscribe((alert) => (this.cartValueAlert = alert));

    this.notificationService.cartExpiryWarning$
      .pipe(takeUntil(this.destroy$))
      .subscribe((warning) => (this.cartExpiryWarning = warning));
  }

  // Cart operations
  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }

  removeFromCart(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  updateQuantity(productId: number, quantity: string) {
    const numQuantity = parseInt(quantity) || 0;
    this.cartService.updateQuantity(productId, numQuantity);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  // Coupon operations
  applyCoupon(code: string) {
    if (code.trim()) {
      this.cartService.applyCoupon(code).subscribe();
    }
  }

  removeCoupon() {
    this.cartService.removeCoupon();
  }

  // User operations
  loginAsMember(level: 'bronze' | 'silver' | 'gold') {
    const user: User = {
      id: Math.floor(Math.random() * 1000),
      name: `${level.charAt(0).toUpperCase() + level.slice(1)} Member`,
      email: `${level}@example.com`,
      membershipLevel: level,
    };
    this.userService.setUser(user);
  }

  logout() {
    this.userService.logout();
  }

  // Utility methods
  getCouponDiscount(): number {
    if (!this.cartSummary.appliedCoupon) return 0;
    return this.couponService.calculateCouponDiscount(
      this.cartSummary.appliedCoupon,
      this.cartSummary.totalPrice
    );
  }

  getFinalTotal(): number {
    return (
      this.cartSummary.discountedPrice +
      this.cartSummary.estimatedTax +
      this.cartSummary.shippingCost
    );
  }

  // Checkout action
  checkout(): void {
    const finalTotal = this.getFinalTotal();
    this.notificationService.showSuccess(
      `Order placed successfully! Total: $${finalTotal.toFixed(2)}`,
      5000
    );
    this.cartService.clearCart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
