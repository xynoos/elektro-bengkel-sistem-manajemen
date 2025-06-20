-- Create storage bucket for equipment images
insert into storage.buckets (id, name)
values ('alat-images', 'alat-images');

-- Set up storage policies
create policy "Images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'alat-images' );

create policy "Anyone can upload an image."
  on storage.objects for insert
  with check ( bucket_id = 'alat-images' );

create policy "Anyone can update an image."
  on storage.objects for update
  with check ( bucket_id = 'alat-images' );

-- Create a table for storing equipment (alat)
create table public.alat (
    id uuid default gen_random_uuid() primary key,
    nama text not null,
    jumlah integer not null default 0,
    kondisi text not null default 'baru' check (kondisi in ('baru', 'bekas', 'rusak')),
    status_stok text not null default 'aman' check (status_stok in ('aman', 'hampir_habis', 'habis')),
    deskripsi text,
    gambar_url text,
    tanggal_ditambahkan timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for user profiles
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    nama text,
    kelas text,
    role text not null default 'user',
    status text not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for equipment borrowing (peminjaman)
create table public.peminjaman (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    alat_id uuid references public.alat(id) on delete cascade not null,
    jumlah integer not null default 1,
    tanggal_pinjam timestamp with time zone default timezone('utc'::text, now()) not null,
    tanggal_kembali timestamp with time zone,
    status text not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.alat enable row level security;
alter table public.profiles enable row level security;
alter table public.peminjaman enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on public.profiles
    for select using (true);

create policy "Users can update own profile." on public.profiles
    for update using (auth.uid() = id);

create policy "Alat viewable by everyone" on public.alat
    for select using (true);

create policy "Alat manageable by admin" on public.alat
    for all using (exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'admin'
    ));

create policy "Peminjaman viewable by admin or owner" on public.peminjaman
    for select using (
        exists (
            select 1 from public.profiles
            where id = auth.uid()
            and role = 'admin'
        ) or auth.uid() = user_id
    );

create policy "Users can create peminjaman" on public.peminjaman
    for insert with check (auth.uid() = user_id);

create policy "Admin can manage peminjaman" on public.peminjaman
    for all using (
        exists (
            select 1 from public.profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );