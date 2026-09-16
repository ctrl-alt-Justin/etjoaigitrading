# Database

This project uses Supabase as its database and accesses it through the official
Supabase JavaScript client. Supabase provides the PostgreSQL database, dashboard,
authentication options, and API layer.

## Change the database

Create a Supabase project, open **Project Settings -> API**, and add these values
to `.env`:

```env
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose it through a
`NEXT_PUBLIC_` variable or commit it to source control.

Open `supabase/schema.sql` in the Supabase SQL Editor and run it once. It creates
the tables, relationships, and indexes used by the app. The sample data is loaded
with `POST /api/seed`.

To change Supabase projects, replace both values in `.env` and restart the Next.js
server. No application code changes are needed.

Example:

```env
SUPABASE_URL="https://example-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-server-only-key"
```

## Schema

### `categories`

Hierarchical furniture taxonomy. `parent_id` points to another category, while
`base_value` stores the reference new-retail value used by pricing.

### `category_attributes`

Attribute definitions for a category, including input type, allowed options,
required flag, and display order.

### `suppliers`

Furniture sources and their contact details, channel, and notes.

### `items`

The inventory record. It stores identifying details, category and supplier links,
flexible JSON attributes, condition/checklist/photos, acquisition and pricing
values, sales data, status, location, featured flag (`is_featured`), and lifecycle timestamps.

### `price_events`

Append-only price history for an item, such as listing, markdown, or sale events.

### `item_shares`

Customer-facing share links for items. Each row has a unique token, optional offer
price and remarks, active state, and timestamps.

### `reviews`

Customer ratings and reviews for individual items. Contains `item_id` (foreign key to `items`),
`rating` (1–5 scale), `author_name`, `content`, and timestamp `created_at`. Indexed by `item_id`.

## PostgreSQL-specific details

The schema uses PostgreSQL `jsonb`, text arrays, identity identifiers, and
`double precision` values. The API is built around Supabase PostgreSQL, so changing
to MySQL or SQLite would require a different database client and schema mapping.