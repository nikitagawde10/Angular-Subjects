import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, timer } from 'rxjs';
import {
  map,
  debounceTime,
  distinctUntilChanged,
  filter,
} from 'rxjs/operators';
import {
  CartState,
  User,
  Coupon,
  Product,
  CartItem,
} from '../shopping-cart.models';

@Injectable({
  providedIn: 'root',
})
export class ShoppingCartService {
  // Core state management with BehaviorSubject
  private cartStateSubject = new BehaviorSubject<CartState>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    discountedPrice: 0,
    isLoading: false,
    lastUpdated: new Date(),
  });

  // User state
  private userSubject = new BehaviorSubject<User | null>(null);

  // Notification system
  private notificationSubject = new BehaviorSubject<string>('');

  // Available coupons
  private availableCouponsSubject = new BehaviorSubject<Coupon[]>([
    {
      code: 'SAVE10',
      discountPercent: 10,
      minAmount: 50,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      code: 'MEMBER20',
      discountPercent: 20,
      minAmount: 100,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  ]);

  // Public observables
  public cartState$ = this.cartStateSubject.asObservable();
  public user$ = this.userSubject.asObservable();
  public notification$ = this.notificationSubject.asObservable();
  public availableCoupons$ = this.availableCouponsSubject.asObservable();

  // Derived observables using complex combinations
  public cartSummary$ = combineLatest([this.cartState$, this.user$]).pipe(
    map(([cartState, user]) => ({
      ...cartState,
      membershipDiscount: this.calculateMembershipDiscount(
        cartState.totalPrice,
        user?.membershipLevel
      ),
      recommendedCoupons: this.getRecommendedCoupons(cartState.totalPrice),
      canCheckout: cartState.items.length > 0 && !cartState.isLoading,
      estimatedTax: cartState.discountedPrice * 0.08,
      shippingCost: this.calculateShipping(
        cartState.totalPrice,
        user?.membershipLevel
      ),
    }))
  );

  // Real-time cart value monitoring
  public cartValueAlert$ = this.cartState$.pipe(
    map((state) => state.totalPrice),
    distinctUntilChanged(),
    filter((totalPrice) => totalPrice > 0),
    debounceTime(1000), // Wait for 1 second of inactivity
    map((totalPrice) => {
      if (totalPrice >= 200) return 'You qualify for premium free shipping!';
      if (totalPrice >= 100)
        return 'Add $' + (200 - totalPrice) + ' more for premium shipping!';
      if (totalPrice >= 50) return 'You qualify for a 10% discount coupon!';
      return '';
    }),
    filter((message) => message !== '')
  );

  // Cart expiry warning
  public cartExpiryWarning$ = timer(0, 60000).pipe(
    // Check every minute
    map(() => {
      const cartState = this.cartStateSubject.value;
      if (cartState.items.length === 0) return '';

      const oldestItem = cartState.items.reduce((oldest, item) =>
        item.addedAt < oldest.addedAt ? item : oldest
      );

      const minutesSinceAdded =
        (Date.now() - oldestItem.addedAt.getTime()) / (1000 * 60);

      if (minutesSinceAdded > 30) {
        return (
          'Your cart items will expire in ' +
          Math.round(60 - minutesSinceAdded) +
          ' minutes'
        );
      }
      return '';
    }),
    filter((message) => message !== '')
  );

  constructor() {
    // Auto-save cart state (simulated)
    this.cartState$
      .pipe(
        debounceTime(2000), // Save after 2 seconds of inactivity
        distinctUntilChanged(
          (prev, curr) =>
            JSON.stringify(prev.items) === JSON.stringify(curr.items)
        )
      )
      .subscribe((state) => {
        this.saveCartToStorage(state);
      });

    // Load saved cart on initialization
    this.loadCartFromStorage();
  }

  // ========== CART OPERATIONS ==========

  addToCart(product: Product, quantity: number = 1): void {
    this.setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const currentState = this.cartStateSubject.value;
      const existingItemIndex = currentState.items.findIndex(
        (item) => item.product.id === product.id
      );

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        updatedItems = [...currentState.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        this.showNotification(`Updated ${product.name} quantity in cart`);
      } else {
        // Add new item
        const newItem: CartItem = {
          product,
          quantity,
          addedAt: new Date(),
        };
        updatedItems = [...currentState.items, newItem];
        this.showNotification(`Added ${product.name} to cart`);
      }

      this.updateCartState(updatedItems);
      this.setLoading(false);
    }, 500);
  }

  removeFromCart(productId: number): void {
    const currentState = this.cartStateSubject.value;
    const updatedItems = currentState.items.filter(
      (item) => item.product.id !== productId
    );
    this.updateCartState(updatedItems);
    this.showNotification('Item removed from cart');
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentState = this.cartStateSubject.value;
    const updatedItems = currentState.items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    this.updateCartState(updatedItems);
  }

  clearCart(): void {
    this.updateCartState([]);
    this.showNotification('Cart cleared');
  }

  // ========== COUPON OPERATIONS ==========

  applyCoupon(couponCode: string): Observable<boolean> {
    return new Observable((observer) => {
      this.setLoading(true);

      // Simulate API call to validate coupon
      setTimeout(() => {
        const availableCoupons = this.availableCouponsSubject.value;
        const coupon = availableCoupons.find((c) => c.code === couponCode);
        const currentState = this.cartStateSubject.value;

        if (!coupon) {
          this.showNotification('Invalid coupon code');
          observer.next(false);
        } else if (coupon.expiresAt < new Date()) {
          this.showNotification('Coupon has expired');
          observer.next(false);
        } else if (currentState.totalPrice < coupon.minAmount) {
          this.showNotification(
            `Minimum order amount of $${coupon.minAmount} required`
          );
          observer.next(false);
        } else {
          // Apply coupon
          const updatedState = {
            ...currentState,
            appliedCoupon: coupon,
            lastUpdated: new Date(),
          };

          this.cartStateSubject.next({
            ...updatedState,
            discountedPrice: this.calculateDiscountedPrice(updatedState),
          });

          this.showNotification(
            `Coupon applied! You saved $${(
              (currentState.totalPrice * coupon.discountPercent) /
              100
            ).toFixed(2)}`
          );
          observer.next(true);
        }

        this.setLoading(false);
        observer.complete();
      }, 1000);
    });
  }

  removeCoupon(): void {
    const currentState = this.cartStateSubject.value;
    const updatedState = {
      ...currentState,
      appliedCoupon: undefined,
      lastUpdated: new Date(),
    };

    this.cartStateSubject.next({
      ...updatedState,
      discountedPrice: this.calculateDiscountedPrice(updatedState),
    });

    this.showNotification('Coupon removed');
  }

  // ========== PRIVATE HELPER METHODS ==========

  private updateCartState(items: CartItem[]): void {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const newState: CartState = {
      items,
      totalItems,
      totalPrice,
      discountedPrice: 0, // Will be calculated below
      appliedCoupon: this.cartStateSubject.value.appliedCoupon,
      isLoading: false,
      lastUpdated: new Date(),
    };

    newState.discountedPrice = this.calculateDiscountedPrice(newState);
    this.cartStateSubject.next(newState);
  }

  private calculateDiscountedPrice(state: CartState): number {
    let discountedPrice = state.totalPrice;

    // Apply product-level discounts
    state.items.forEach((item) => {
      if (item.product.discount) {
        const itemTotal = item.product.price * item.quantity;
        const itemDiscount = (itemTotal * item.product.discount) / 100;
        discountedPrice -= itemDiscount;
      }
    });

    // Apply coupon discount
    if (state.appliedCoupon) {
      discountedPrice *= 1 - state.appliedCoupon.discountPercent / 100;
    }

    // Apply membership discount
    const user = this.userSubject.value;
    if (user) {
      const membershipDiscount = this.calculateMembershipDiscount(
        discountedPrice,
        user.membershipLevel
      );
      discountedPrice -= membershipDiscount;
    }

    return Math.max(0, discountedPrice);
  }

  private calculateMembershipDiscount(
    totalPrice: number,
    membershipLevel?: string
  ): number {
    if (!membershipLevel) return 0;

    switch (membershipLevel) {
      case 'bronze':
        return totalPrice * 0.05; // 5%
      case 'silver':
        return totalPrice * 0.1; // 10%
      case 'gold':
        return totalPrice * 0.15; // 15%
      default:
        return 0;
    }
  }

  private calculateShipping(
    totalPrice: number,
    membershipLevel?: string
  ): number {
    if (totalPrice >= 200 || membershipLevel === 'gold') return 0; // Free shipping
    if (totalPrice >= 100 || membershipLevel === 'silver') return 5.99;
    if (membershipLevel === 'bronze') return 7.99;
    return 9.99;
  }

  private getRecommendedCoupons(totalPrice: number): Coupon[] {
    return this.availableCouponsSubject.value.filter(
      (coupon) =>
        totalPrice >= coupon.minAmount * 0.8 && // Within 20% of minimum
        coupon.expiresAt > new Date()
    );
  }

  private setLoading(loading: boolean): void {
    const currentState = this.cartStateSubject.value;
    this.cartStateSubject.next({ ...currentState, isLoading: loading });
  }

  private showNotification(message: string): void {
    this.notificationSubject.next(message);
    // Clear notification after 3 seconds
    setTimeout(() => this.notificationSubject.next(''), 3000);
  }

  private saveCartToStorage(state: CartState): void {
    // Simulate saving to localStorage or API
    console.log('Cart saved:', state);
  }

  private loadCartFromStorage(): void {
    // Simulate loading from localStorage or API
    // In real app, you would restore the cart state here
  }

  // ========== PUBLIC UTILITY METHODS ==========

  getCartValue(): number {
    return this.cartStateSubject.value.discountedPrice;
  }

  getItemCount(): number {
    return this.cartStateSubject.value.totalItems;
  }

  hasItem(productId: number): boolean {
    return this.cartStateSubject.value.items.some(
      (item) => item.product.id === productId
    );
  }

  getItemQuantity(productId: number): number {
    const item = this.cartStateSubject.value.items.find(
      (item) => item.product.id === productId
    );
    return item ? item.quantity : 0;
  }
}
