import { customers, products, orders } from './shop.data';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** The sample shop as PostgreSQL DDL + inserts, derived from shop.data.ts. */
export const SHOP_SQL = `
CREATE TABLE customers (id serial PRIMARY KEY, name text NOT NULL, city text, created_at date);
CREATE TABLE products (id serial PRIMARY KEY, name text NOT NULL, price_cents int NOT NULL, category text);
CREATE TABLE orders (
  id serial PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers (id),
  status text NOT NULL CHECK (status IN ('paid', 'shipped', 'refunded', 'pending')),
  placed_at date NOT NULL
);
CREATE TABLE order_items (
  order_id int NOT NULL REFERENCES orders (id),
  product_id int NOT NULL REFERENCES products (id),
  qty int NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_id, product_id)
);
INSERT INTO customers (id, name, city, created_at) VALUES
${customers.map((c) => `  (${c.id}, ${q(c.name)}, ${q(c.city)}, ${q(c.createdAt)})`).join(',\n')};
INSERT INTO products (id, name, price_cents, category) VALUES
${products.map((p) => `  (${p.id}, ${q(p.name)}, ${p.priceCents}, ${q(p.category)})`).join(',\n')};
INSERT INTO orders (id, customer_id, status, placed_at) VALUES
${orders.map((o) => `  (${o.id}, ${o.customerId}, ${q(o.status)}, ${q(o.placedAt)})`).join(',\n')};
INSERT INTO order_items (order_id, product_id, qty) VALUES
${orders.flatMap((o) => o.items.map((i) => `  (${o.id}, ${i.productId}, ${i.qty})`)).join(',\n')};
SELECT setval(pg_get_serial_sequence('customers', 'id'), (SELECT max(id) FROM customers));
SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT max(id) FROM products));
SELECT setval(pg_get_serial_sequence('orders', 'id'), (SELECT max(id) FROM orders));
`;

export const SQL_SCHEMA = [
	{ name: 'customers', cols: ['id serial pk', 'name text', 'city text', 'created_at date'] },
	{ name: 'products', cols: ['id serial pk', 'name text', 'price_cents int', 'category text'] },
	{ name: 'orders', cols: ['id serial pk', 'customer_id int → customers', "status text (paid, shipped, refunded, pending)", 'placed_at date'] },
	{ name: 'order_items', cols: ['order_id int → orders', 'product_id int → products', 'qty int', 'pk (order_id, product_id)'] }
];
