export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  discount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  discountedPrice: number;
  appliedCoupon?: Coupon;
  isLoading: boolean;
  lastUpdated: Date;
}

export interface CartSummary {
  membershipDiscount: number;
  recommendedCoupons: Coupon[];
  canCheckout: boolean;
  estimatedTax: number;
  shippingCost: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  discountedPrice: number;
  appliedCoupon?: Coupon;
  isLoading: boolean;
  lastUpdated: Date;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minAmount: number;
  expiresAt: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
  membershipLevel: 'bronze' | 'silver' | 'gold';
}

export interface NotificationMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
}
