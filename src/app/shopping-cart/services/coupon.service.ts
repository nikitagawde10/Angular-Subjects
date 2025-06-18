// ========== COUPON SERVICE ==========
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Coupon, mockCoupons } from '../shopping-cart.utils';

export interface CouponValidationResult {
  isValid: boolean;
  message: string;
  coupon?: Coupon;
}

@Injectable({
  providedIn: 'root',
})
export class CouponService {
  private availableCouponsSubject = new BehaviorSubject<Coupon[]>(mockCoupons);

  public availableCoupons$ = this.availableCouponsSubject.asObservable();

  validateCoupon(
    couponCode: string,
    cartTotal: number
  ): Observable<CouponValidationResult> {
    return new Observable((observer) => {
      // Simulate API call delay
      setTimeout(() => {
        const availableCoupons = this.availableCouponsSubject.value;
        const coupon = availableCoupons.find(
          (c) => c.code.toLowerCase() === couponCode.toLowerCase()
        );

        if (!coupon) {
          observer.next({
            isValid: false,
            message: 'Invalid coupon code',
          });
        } else if (coupon.expiresAt < new Date()) {
          observer.next({
            isValid: false,
            message: 'Coupon has expired',
          });
        } else if (cartTotal < coupon.minAmount) {
          observer.next({
            isValid: false,
            message: `Minimum order amount of $${coupon.minAmount} required`,
          });
        } else {
          observer.next({
            isValid: true,
            message: `Coupon applied successfully! You saved $${(
              (cartTotal * coupon.discountPercent) /
              100
            ).toFixed(2)}`,
            coupon,
          });
        }

        observer.complete();
      }, 800);
    });
  }

  getRecommendedCoupons(totalPrice: number): Coupon[] {
    return this.availableCouponsSubject.value.filter(
      (coupon) =>
        totalPrice >= coupon.minAmount * 0.8 && // Within 20% of minimum
        coupon.expiresAt > new Date()
    );
  }

  calculateCouponDiscount(coupon: Coupon, totalPrice: number): number {
    if (!coupon || totalPrice < coupon.minAmount) return 0;
    return totalPrice * (coupon.discountPercent / 100);
  }

  getAllCoupons(): Coupon[] {
    return this.availableCouponsSubject.value;
  }

  addCoupon(coupon: Coupon): void {
    const currentCoupons = this.availableCouponsSubject.value;
    this.availableCouponsSubject.next([...currentCoupons, coupon]);
  }

  removeCoupon(couponCode: string): void {
    const currentCoupons = this.availableCouponsSubject.value;
    const updatedCoupons = currentCoupons.filter((c) => c.code !== couponCode);
    this.availableCouponsSubject.next(updatedCoupons);
  }

  isCouponExpired(coupon: Coupon): boolean {
    return coupon.expiresAt < new Date();
  }
}
