-- Enable UUID extension if needed
create extension if not exists "uuid-ossp";

-- Subscribers Table
create table if not exists subscribers (
  id uuid default uuid_generate_v4() primary key,
  phone text unique not null,                      -- E.164 format with 'whatsapp:' prefix, e.g., 'whatsapp:+1234567890'
  wa_id text,                                      -- Raw WhatsApp ID / phone number
  language text default 'both' not null,           -- 'fa', 'en', or 'both'
  active boolean default true not null,            -- subscription state
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_inbound_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for phone queries
create index if not exists subscribers_phone_idx on subscribers(phone);
create index if not exists subscribers_active_idx on subscribers(active);

-- Sent Logs Table (for daily idempotency)
create table if not exists sent_log (
  id uuid default uuid_generate_v4() primary key,
  type text not null,                              -- 'schedule' or 'results'
  match_date date not null,                        -- target date of the report (YYYY-MM-DD)
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_sent_type_date unique (type, match_date)
);
