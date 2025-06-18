import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import {
  map,
  debounceTime,
  distinctUntilChanged,
  tap,
  catchError,
} from 'rxjs/operators';
import {
  CartState,
  CartItem,
  Product,
  CartSummary,
} from '../shopping-cart.utils';
import { UserService } from './user.service';
import { CouponService, CouponValidationResult } from './coupon.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartStateSubject = new BehaviorSubject<CartState>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    discountedPrice: 0,
    appliedCoupon: undefined,
    isLoading: false,
    lastUpdated: new Date(),
  });
  public cartState$ = this.cartStateSubject.asObservable();

  public cartSummary$!: Observable<CartSummary>;

  constructor(
    private userService: UserService,
    private couponService: CouponService,
    private notificationService: NotificationService
  ) {
    this.initializeCartMonitoring();

    // Initialize cartSummary$ after services are assigned
    this.cartSummary$ = combineLatest([
      this.cartState$,
      this.userService.user$,
    ]).pipe(
      map(([state, user]) => {
        const membershipDiscount = this.userService.calculateMembershipDiscount(
          state.totalPrice,
          user?.membershipLevel
        );
        const recommendedCoupons = this.couponService.getRecommendedCoupons(
          state.totalPrice
        );
        return {
          ...state,
          membershipDiscount,
          recommendedCoupons,
          canCheckout: state.items.length > 0 && !state.isLoading,
          estimatedTax: state.discountedPrice * 0.08,
          shippingCost: this.userService.calculateShipping(
            state.totalPrice,
            user?.membershipLevel
          ),
        };
      })
    );

    // Start cart expiry timer
    this.startCartExpiryMonitoring();
  }

  // ----- CART OPERATIONS -----
  addToCart(product: Product, quantity = 1): void {
    const items = this.cartStateSubject.value.items;
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    let updatedItems: CartItem[];
    if (existingIndex >= 0) {
      updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + quantity,
      };
      this.notificationService.showSuccess(`Updated ${product.name} quantity`);
    } else {
      updatedItems = [...items, { product, quantity, addedAt: new Date() }];
      this.notificationService.showSuccess(`Added ${product.name} to cart`);
    }

    this.updateCartState(updatedItems);
  }

  removeFromCart(productId: number): void {
    const { items } = this.cartStateSubject.value;
    const updated = items.filter((i) => i.product.id !== productId);
    this.updateCartState(updated);
    this.notificationService.showInfo('Item removed from cart');
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const updated = this.cartStateSubject.value.items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    this.updateCartState(updated);
    const updatedProduct = updated.find(
      (i) => i.product.id === productId
    )?.product;
    if (updatedProduct) {
      this.notificationService.showSuccess(
        `Updated ${updatedProduct.name} quantity to ${quantity}`
      );
    }
  }

  clearCart(): void {
    this.updateCartState([]);
    this.notificationService.showInfo('Cart cleared');
    // Clear all alerts when cart is cleared
    this.notificationService.clearAllAlerts();
  }

  // ----- COUPON OPERATIONS -----

  applyCoupon(code: string): Observable<boolean> {
    const total = this.cartStateSubject.value.totalPrice;
    return this.couponService.validateCoupon(code, total).pipe(
      tap((result: CouponValidationResult) => {
        if (result.isValid && result.coupon) {
          this.cartStateSubject.next({
            ...this.cartStateSubject.value,
            appliedCoupon: result.coupon,
            discountedPrice: this.calculateDiscountedPrice({
              ...this.cartStateSubject.value,
              appliedCoupon: result.coupon,
            }),
            lastUpdated: new Date(),
          });
          this.notificationService.showSuccess(result.message);
        } else {
          this.notificationService.showError(result.message);
        }
      }),
      map((result) => result.isValid),
      catchError(() => {
        this.notificationService.showError('Coupon validation failed');
        return of(false);
      })
    );
  }

  removeCoupon(): void {
    const newState = {
      ...this.cartStateSubject.value,
      appliedCoupon: undefined,
    };
    this.cartStateSubject.next({
      ...newState,
      discountedPrice: this.calculateDiscountedPrice(newState),
      lastUpdated: new Date(),
    });
    this.notificationService.showInfo('Coupon removed');
  }

  // ----- PRIVATE HELPERS -----
  // Update cart state and trigger notifications
  private updateCartState(items: CartItem[]): void {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );

    const newState: CartState = {
      ...this.cartStateSubject.value,
      items,
      totalItems,
      totalPrice,
      lastUpdated: new Date(),
    };

    newState.discountedPrice = this.calculateDiscountedPrice(newState);
    this.cartStateSubject.next(newState);

    // Trigger alerts
    this.notificationService.updateCartValueAlert(totalPrice);
  }

  // Calculate final price with all discounts
  private calculateDiscountedPrice(state: CartState): number {
    let price = state.totalPrice;
    // Apply product discounts
    state.items.forEach((item) => {
      if (item.product.discount) {
        price -=
          (item.product.price * item.quantity * item.product.discount) / 100;
      }
    });
    // Apply coupon discount
    if (state.appliedCoupon) {
      price *= 1 - state.appliedCoupon.discountPercent / 100;
    }
    // Apply membership discount
    const user = this.userService.getCurrentUser();
    if (user) {
      price -= this.userService.calculateMembershipDiscount(
        price,
        user.membershipLevel
      );
    }
    return Math.max(0, price);
  }

  private initializeCartMonitoring(): void {
    this.cartState$
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(
          (a, b) => JSON.stringify(a.items) === JSON.stringify(b.items)
        )
      )
      .subscribe((state) => this.saveCartToStorage(state));
  }

  private startCartExpiryMonitoring(): void {
    // Start the cart expiry timer
    this.notificationService
      .startCartExpiryTimer(() => {
        const items = this.cartStateSubject.value.items;
        if (items.length === 0) return null;

        // Find the oldest item in the cart
        const oldestItem = items.reduce((oldest, current) => {
          return current.addedAt < oldest.addedAt ? current : oldest;
        });

        return oldestItem.addedAt;
      })
      .subscribe(); // Subscribe to start the timer
  }

  private saveCartToStorage(state: CartState): void {
    console.log('Saved cart:', state);
  }

  // ----- PUBLIC UTILITIES -----

  getCartValue(): number {
    return this.cartStateSubject.value.discountedPrice;
  }

  getItemCount(): number {
    return this.cartStateSubject.value.totalItems;
  }

  hasItem(productId: number): boolean {
    return this.cartStateSubject.value.items.some(
      (i) => i.product.id === productId
    );
  }

  getItemQuantity(productId: number): number {
    const item = this.cartStateSubject.value.items.find(
      (i) => i.product.id === productId
    );
    return item ? item.quantity : 0;
  }
}
