import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import {
  map,
  debounceTime,
  distinctUntilChanged,
  tap,
  catchError,
  finalize,
} from 'rxjs/operators';
import {
  CartState,
  CartItem,
  Product,
  CartSummary,
} from '../shopping-cart.models';
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
    this.loadCartFromStorage();

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

  addToCart(product: Product, quantity: number = 1): void {
    this.setLoading(true);
    setTimeout(() => {
      const { items } = this.cartStateSubject.value;
      const idx = items.findIndex((i) => i.product.id === product.id);
      let updated: CartItem[];
      if (idx >= 0) {
        updated = [...items];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + quantity,
        };
        this.notificationService.showSuccess(
          `Updated ${product.name} quantity in cart`
        );
      } else {
        updated = [...items, { product, quantity, addedAt: new Date() }];
        this.notificationService.showSuccess(`Added ${product.name} to cart`);
      }
      this.updateCartState(updated);
      this.setLoading(false);
    }, 500);
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
    const updated = this.cartStateSubject.value.items.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    this.updateCartState(updated);
  }

  clearCart(): void {
    this.updateCartState([]);
    this.notificationService.showInfo('Cart cleared');
    // Clear all alerts when cart is cleared
    this.notificationService.clearAllAlerts();
  }

  // ----- COUPON OPERATIONS -----

  applyCoupon(code: string): Observable<boolean> {
    this.setLoading(true);
    const total = this.cartStateSubject.value.totalPrice;
    return this.couponService.validateCoupon(code, total).pipe(
      tap((res: CouponValidationResult) => {
        if (res.isValid && res.coupon) {
          const newState = {
            ...this.cartStateSubject.value,
            appliedCoupon: res.coupon,
            lastUpdated: new Date(),
          };
          this.cartStateSubject.next({
            ...newState,
            discountedPrice: this.calculateDiscountedPrice(newState),
          });
          this.notificationService.showSuccess(res.message);
        } else {
          this.notificationService.showError(res.message);
        }
      }),
      map((res) => res.isValid),
      catchError(() => {
        this.notificationService.showError('Coupon validation failed');
        return of(false);
      }),
      finalize(() => this.setLoading(false))
    );
  }

  removeCoupon(): void {
    const state = this.cartStateSubject.value;
    const newState = {
      ...state,
      appliedCoupon: undefined,
      lastUpdated: new Date(),
    };
    this.cartStateSubject.next({
      ...newState,
      discountedPrice: this.calculateDiscountedPrice(newState),
    });
    this.notificationService.showInfo('Coupon removed');
  }

  // ----- PRIVATE HELPERS -----

  private updateCartState(items: CartItem[]): void {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );
    const baseState: CartState = {
      ...this.cartStateSubject.value,
      items,
      totalItems,
      totalPrice,
      isLoading: false,
      lastUpdated: new Date(),
    };
    this.cartStateSubject.next({
      ...baseState,
      discountedPrice: this.calculateDiscountedPrice(baseState),
    });

    // Update cart value alerts whenever cart state changes
    this.notificationService.updateCartValueAlert(totalPrice);
  }

  private calculateDiscountedPrice(state: CartState): number {
    let price = state.totalPrice;
    state.items.forEach((i) => {
      if (i.product.discount) {
        price -= (i.product.price * i.quantity * i.product.discount) / 100;
      }
    });
    if (state.appliedCoupon) {
      price *= 1 - state.appliedCoupon.discountPercent / 100;
    }
    const user = this.userService.getCurrentUser();
    if (user) {
      price -= this.userService.calculateMembershipDiscount(
        price,
        user.membershipLevel
      );
    }
    return Math.max(0, price);
  }

  private setLoading(loading: boolean): void {
    const curr = this.cartStateSubject.value;
    this.cartStateSubject.next({ ...curr, isLoading: loading });
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

  private loadCartFromStorage(): void {
    // load from API/localStorage as needed
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
