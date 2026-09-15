begin;

with category_rows as (
  insert into public.categories (name, slug, sort_order, base_value)
  values
    ('Task Chairs', 'task-chairs', 1, 52500),
    ('Standing Desks', 'standing-desks', 2, 49500)
  on conflict (slug) do update set name = excluded.name
  returning id, slug
), inserted_items as (
  insert into public.items (
    sku,
    name,
    brand,
    model,
    category_id,
    attributes,
    color,
    material,
    dimensions,
    grade,
    checklist,
    photos,
    condition_notes,
    acquisition_cost,
    refurb_cost,
    listed_price,
    floor_price,
    benchmark_price,
    value_low,
    value_high,
    status,
    location,
    intake_at,
    listed_at,
    updated_at
  )
  select
    sample.sku,
    sample.name,
    sample.brand,
    sample.model,
    category_rows.id,
    sample.attributes,
    sample.color,
    sample.material,
    sample.dimensions,
    sample.grade,
    sample.checklist,
    sample.photos,
    sample.condition_notes,
    sample.acquisition_cost,
    sample.refurb_cost,
    sample.listed_price,
    sample.floor_price,
    sample.benchmark_price,
    sample.value_low,
    sample.value_high,
    sample.status,
    sample.location,
    sample.intake_at,
    sample.listed_at,
    now()
  from (values
    (
      'RF-DEMO-001',
      'Herman Miller Aeron Remastered',
      'Herman Miller',
      'Aeron Remastered',
      'task-chairs',
      '{"Arms":"Fully adjustable","Mechanism":"Synchro-tilt","Lumbar":"Adjustable add-on"}'::jsonb,
      'Graphite',
      'Pellicle mesh and alloy base',
      'W 68 x D 67 x H 98-104 cm',
      'A',
      '[{"key":"frame","label":"Frame inspected","status":"pass"},{"key":"mechanism","label":"Mechanism tested","status":"pass"}]'::jsonb,
      '[]'::jsonb,
      'Excellent condition with light signs of use.',
      18000.00,
      500.00,
      28500.00,
      22200.00,
      52500.00,
      26000.00,
      33000.00,
      'listed',
      'Makati Warehouse',
      now() - interval '5 days',
      now() - interval '2 days'
    ),
    (
      'RF-DEMO-002',
      'IKEA Bekant Sit/Stand 160',
      'IKEA',
      'Bekant Sit/Stand 160',
      'standing-desks',
      '{"Width":"160 cm","Motor":"Dual","Controller":"Basic up/down"}'::jsonb,
      'White',
      'Melamine and steel frame',
      'W 160 x D 80 x H 65-125 cm',
      'B',
      '[{"key":"surface","label":"Surface inspected","status":"pass"},{"key":"motor","label":"Motor tested","status":"pass"}]'::jsonb,
      '[]'::jsonb,
      'Minor surface marks; height adjustment works correctly.',
      9500.00,
      250.00,
      null,
      12000.00,
      49500.00,
      14500.00,
      19000.00,
      'in_stock',
      'Cebu Warehouse',
      now() - interval '1 day',
      null
    )
  ) as sample(
    sku, name, brand, model, category_slug, attributes, color, material,
    dimensions, grade, checklist, photos, condition_notes, acquisition_cost,
    refurb_cost, listed_price, floor_price, benchmark_price, value_low,
    value_high, status, location, intake_at, listed_at
  )
  join category_rows on category_rows.slug = sample.category_slug
  where not exists (
    select 1 from public.items existing where existing.sku = sample.sku
  )
  returning id, sku, acquisition_cost, listed_price, status
)
insert into public.price_events (item_id, kind, price, note)
select id, 'intake', acquisition_cost, 'Sample intake recorded'
from inserted_items
union all
select id, 'listed', listed_price, 'Sample item listed'
from inserted_items
where status = 'listed' and listed_price is not null;

commit;

select id, sku, name, status, listed_price
from public.items
where sku in ('RF-DEMO-001', 'RF-DEMO-002')
order by sku;
