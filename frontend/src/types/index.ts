/**
 * Domain model for the Two Souls marketplace.
 *
 * A note on `Numeric`: the API is backed by DynamoDB through a Lambda that writes whatever JSON
 * it is handed. Prices entered through the admin forms arrive as strings (an `<input>` value is
 * always a string), while defaults set server-side arrive as numbers. Every numeric field is
 * therefore typed as `Numeric` and must be read through `toNumber()` from `lib/format`.
 */
export type Numeric = string | number;

export const SELLER_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export const PRODUCT_STATUSES = ['PUBLISHED', 'DRAFT', 'OUT_OF_STOCK', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'REFUNDED', 'FAILED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Seller {
  seller_id: string;
  store_name: string;
  business_name?: string;
  /** Primary contact person, not the store. */
  name?: string;
  email?: string;
  phone_number?: string;
  tax_id?: string;
  status?: SellerStatus;
  commission_rate?: Numeric;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  product_id: string;
  title: string;
  category?: string;
  sku?: string;
  description?: string;
  /** Cost to the marketplace. Admin-only — never rendered on the storefront. */
  buy_price?: Numeric;
  /** Retail price shown to shoppers. */
  sell_price?: Numeric;
  stock_quantity?: Numeric;
  status?: ProductStatus;
  imageUrl?: string;
  seller_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  product_id: string;
  title: string;
  sku?: string;
  seller_id?: string;
  imageUrl?: string;
  unit_price: Numeric;
  quantity: Numeric;
  line_total: Numeric;
}

export interface Order {
  order_id: string;
  order_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  items?: OrderItem[];
  shipping_address?: ShippingAddress;
  subtotal?: Numeric;
  shipping?: Numeric;
  total_amount?: Numeric;
  currency?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  placed_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload shapes for writes. The server fills in the primary key when absent, so it stays
 * optional here — that is what distinguishes a create from an update.
 */
export type SellerInput = Omit<Seller, 'seller_id' | 'created_at' | 'updated_at'> & {
  seller_id?: string;
};

export type ProductInput = Omit<Product, 'product_id' | 'created_at' | 'updated_at'> & {
  product_id?: string;
};

export type OrderInput = Omit<Order, 'order_id' | 'created_at' | 'updated_at'> & {
  order_id?: string;
};

/** A line in the shopper's cart. Unlike `OrderItem`, these are real numbers — the cart is ours. */
export interface CartLine {
  product_id: string;
  title: string;
  sku?: string;
  seller_id?: string;
  imageUrl?: string;
  unit_price: number;
  quantity: number;
  /** Snapshot of availability at add-to-cart time, used to cap the quantity stepper. */
  stock_quantity?: number;
}

export interface AdminUser {
  username: string;
}
