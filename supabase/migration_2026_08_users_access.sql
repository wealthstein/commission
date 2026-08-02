-- Run this against your LIVE Supabase database (SQL Editor) to bring the
-- users table in line with the current schema, without touching any
-- existing rows or wiping data - unlike running the full schema.sql, which
-- drops and recreates every table from scratch.

alter table users add column if not exists access_granted boolean not null default false;
alter table users add column if not exists intended_role text check (intended_role in ('business','affiliate'));
alter table users add column if not exists signup_source_page text;
