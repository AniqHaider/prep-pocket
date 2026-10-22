import { customers, products, orders } from './shop.data';

export type Doc = Record<string, unknown>;
export type Collections = Record<string, Doc[]>;

/** The sample shop as MongoDB collections, derived from shop.data.ts. Fresh copies on every call. */
export function shopCollections(): Collections {
	return {
		customers: customers.map((c) => ({ _id: c.id, name: c.name, city: c.city, createdAt: c.createdAt })),
		products: products.map((p) => ({ _id: p.id, name: p.name, priceCents: p.priceCents, category: p.category, tags: [...p.tags] })),
		orders: orders.map((o) => ({ _id: o.id, customerId: o.customerId, status: o.status, placedAt: o.placedAt, items: o.items.map((i) => ({ ...i })) }))
	};
}

export const MONGO_SCHEMA = [
	{ name: 'customers', fields: ['_id: Number', 'name', 'city', "createdAt: 'YYYY-MM-DD'"] },
	{ name: 'products', fields: ['_id: Number', 'name', 'priceCents: Number', 'category', 'tags: [String]'] },
	{ name: 'orders', fields: ['_id: Number', 'customerId: Number', 'status', "placedAt: 'YYYY-MM-DD'", 'items: [{ productId, qty }]'] }
];
