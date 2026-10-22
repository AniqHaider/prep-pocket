// ONE source of truth for the playground's sample shop. shop.sql.ts and shop.mongo.ts both derive from it,
// so PostgreSQL and MongoDB always describe the same customers, products and orders.

export const customers = [
	{ id: 1, name: 'Asha', city: 'Pune', createdAt: '2024-11-02' },
	{ id: 2, name: 'Ben', city: 'Leeds', createdAt: '2024-11-19' },
	{ id: 3, name: 'Chen', city: 'Oslo', createdAt: '2024-12-05' },
	{ id: 4, name: 'Dara', city: 'Lima', createdAt: '2024-12-21' },
	{ id: 5, name: 'Esi', city: 'Accra', createdAt: '2025-01-08' },
	{ id: 6, name: 'Farid', city: 'Cairo', createdAt: '2025-01-27' },
	{ id: 7, name: 'Gita', city: 'Delhi', createdAt: '2025-02-10' },
	{ id: 8, name: 'Hugo', city: 'Paris', createdAt: '2025-03-03' } // never ordered
];

export const products = [
	{ id: 1, name: 'Notebook', priceCents: 450, category: 'stationery', tags: ['paper', 'school'] },
	{ id: 2, name: 'Backpack', priceCents: 5900, category: 'bags', tags: ['travel', 'school'] },
	{ id: 3, name: 'Headphones', priceCents: 8900, category: 'electronics', tags: ['audio', 'wireless'] },
	{ id: 4, name: 'Mug', priceCents: 1200, category: 'home', tags: ['kitchen', 'gift'] },
	{ id: 5, name: 'Desk lamp', priceCents: 3400, category: 'home', tags: ['office', 'light'] },
	{ id: 6, name: 'Water bottle', priceCents: 1800, category: 'outdoors', tags: ['travel', 'gift'] },
	{ id: 7, name: 'Keyboard', priceCents: 7500, category: 'electronics', tags: ['office', 'wireless'] },
	{ id: 8, name: 'Mouse pad', priceCents: 900, category: 'electronics', tags: ['office'] },
	{ id: 9, name: 'Sticker pack', priceCents: 350, category: 'stationery', tags: ['gift'] }, // never ordered
	{ id: 10, name: 'Charger', priceCents: 2500, category: 'electronics', tags: ['travel'] }
];

export type Status = 'paid' | 'shipped' | 'refunded' | 'pending';
export const orders: { id: number; customerId: number; status: Status; placedAt: string; items: { productId: number; qty: number }[] }[] = [
	{ id: 1, customerId: 1, status: 'paid', placedAt: '2025-01-12', items: [{ productId: 1, qty: 2 }, { productId: 4, qty: 1 }] },
	{ id: 2, customerId: 1, status: 'shipped', placedAt: '2025-02-03', items: [{ productId: 3, qty: 1 }] },
	{ id: 3, customerId: 2, status: 'paid', placedAt: '2025-01-20', items: [{ productId: 7, qty: 1 }, { productId: 8, qty: 1 }] },
	{ id: 4, customerId: 2, status: 'refunded', placedAt: '2025-03-02', items: [{ productId: 2, qty: 1 }] },
	{ id: 5, customerId: 3, status: 'shipped', placedAt: '2025-02-14', items: [{ productId: 5, qty: 1 }, { productId: 4, qty: 2 }, { productId: 1, qty: 1 }] },
	{ id: 6, customerId: 3, status: 'pending', placedAt: '2025-04-01', items: [{ productId: 10, qty: 2 }] },
	{ id: 7, customerId: 4, status: 'paid', placedAt: '2025-02-21', items: [{ productId: 6, qty: 3 }] },
	{ id: 8, customerId: 4, status: 'paid', placedAt: '2025-03-15', items: [{ productId: 3, qty: 1 }, { productId: 10, qty: 1 }, { productId: 8, qty: 2 }] },
	{ id: 9, customerId: 5, status: 'shipped', placedAt: '2025-03-08', items: [{ productId: 1, qty: 4 }] },
	{ id: 10, customerId: 5, status: 'paid', placedAt: '2025-04-10', items: [{ productId: 7, qty: 1 }, { productId: 5, qty: 1 }] },
	{ id: 11, customerId: 6, status: 'refunded', placedAt: '2025-03-30', items: [{ productId: 3, qty: 1 }] },
	{ id: 12, customerId: 6, status: 'paid', placedAt: '2025-05-02', items: [{ productId: 2, qty: 1 }, { productId: 6, qty: 1 }] },
	{ id: 13, customerId: 7, status: 'pending', placedAt: '2025-05-19', items: [{ productId: 4, qty: 3 }, { productId: 1, qty: 1 }] },
	{ id: 14, customerId: 7, status: 'shipped', placedAt: '2025-05-25', items: [{ productId: 10, qty: 1 }] },
	{ id: 15, customerId: 2, status: 'paid', placedAt: '2025-06-01', items: [{ productId: 4, qty: 2 }, { productId: 6, qty: 2 }, { productId: 8, qty: 1 }, { productId: 1, qty: 3 }] }
];
