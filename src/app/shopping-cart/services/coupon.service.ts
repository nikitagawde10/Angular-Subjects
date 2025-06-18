// ========== COUPON SERVICE ==========
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Coupon } from '../shopping-cart.models';

export interface CouponValidationResult {
  isValid: boolean;
  message: string;
  coupon?: Coupon;
}

@Injectable({
  providedIn: 'root',
})
export class CouponService {
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
    {
      code: 'FREESHIP',
      discountPercent: 0,
      minAmount: 75,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  ]);

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
