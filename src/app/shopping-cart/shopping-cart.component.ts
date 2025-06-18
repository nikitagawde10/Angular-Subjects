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

  // Initialize with default values to prevent undefined issues
  cartSummary: CartSummary = {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    membershipDiscount: 0,
    discountedPrice: 0,
    estimatedTax: 0,
    shippingCost: 0,
    appliedCoupon: undefined,
    recommendedCoupons: [],
    canCheckout: false,
    isLoading: false,
    lastUpdated: new Date(),
  };

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
      .subscribe((summary) => {
        this.cartSummary = summary;
        console.log('Cart summary updated:', summary); // Debug log
      });

    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => (this.user = user));

    this.notificationService.notification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.notification = notification;
        console.log('Notification received:', notification);
      });

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
    if (numQuantity > 0) {
      this.cartService.updateQuantity(productId, numQuantity);
    }
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

  // Enhanced checkout action with better error handling
  checkout(): void {
    console.log('Checkout clicked!'); // Debug log
    console.log('Cart can checkout:', this.cartSummary.canCheckout); // Debug log
    console.log('Cart summary before checkout:', this.cartSummary); // Debug log

    // Check if cart is empty
    if (!this.cartSummary.items || this.cartSummary.items.length === 0) {
      this.notificationService.showError('Your cart is empty!');
      return;
    }

    // Check if checkout is allowed
    if (!this.cartSummary.canCheckout) {
      this.notificationService.showError('Unable to checkout at this time.');
      return;
    }

    try {
      // Calculate final total BEFORE clearing cart
      const finalTotal = this.getFinalTotal();
      console.log('Final total calculated:', finalTotal); // Debug log

      // Clear the cart FIRST
      this.cartService.clearCart();

      // Show success notification AFTER clearing cart
      this.notificationService.showSuccess(
        `Order placed successfully! Total: ${finalTotal.toFixed(2)}`,
        5000
      );

      console.log('Success notification called with total:', finalTotal); // Debug log
    } catch (error) {
      console.error('Checkout error:', error);
      this.notificationService.showError('An error occurred during checkout.');
    }
  }

  // Alternative checkout method for debugging
  debugCheckout(): void {
    console.log('Debug checkout called');
    this.notificationService.showSuccess('Debug notification test!', 3000);
  }

  // Test notification methods
  testNotification(): void {
    console.log('Testing notification service...');
    this.notificationService.showSuccess('Test notification working!', 3000);
  }

  testError(): void {
    this.notificationService.showError('Test error notification!', 3000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
