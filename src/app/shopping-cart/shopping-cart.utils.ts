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

export const mockCoupons: Coupon[] = [
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
];

export const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Gaming Laptop',
    price: 999.99,
    category: 'Electronics',
    inStock: true,
  },
  {
    id: 2,
    name: 'Wireless Headphones',
    price: 199.99,
    category: 'Electronics',
    inStock: true,
    discount: 15,
  },
  {
    id: 3,
    name: 'Programming Book',
    price: 29.99,
    category: 'Books',
    inStock: true,
  },
  {
    id: 4,
    name: 'Smart Coffee Maker',
    price: 89.99,
    category: 'Appliances',
    inStock: true,
    discount: 10,
  },
  {
    id: 5,
    name: 'Mechanical Keyboard',
    price: 149.99,
    category: 'Electronics',
    inStock: false,
  },
  {
    id: 6,
    name: 'Desk Chair',
    price: 299.99,
    category: 'Furniture',
    inStock: true,
    discount: 20,
  },
];
