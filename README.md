
# Kanban Supabase (Next.js + App Router + Tailwind + Drag & Drop)

## 1) Variáveis de ambiente

Crie `.env.local` na raiz:

```
NEXT_PUBLIC_SUPABASE_URL=SEU_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

## 2) Dependências

```
npm install
```

## 3) Rodar

```
npm run dev
```

## 4) Supabase - schema

Execute no SQL do Supabase:

```
create table columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "order" integer not null
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  column_id uuid references columns(id) on delete cascade,
  "order" integer not null
);

insert into columns (title, "order") values
('Entregas planejadas', 0),
('Em desenvolvimento', 1),
('Lançamentos recentes', 2);
```

### Políticas RLS (liberar leitura e escrita anônima)

> Apenas para demo. Em produção, ajuste conforme sua auth.

```
alter table columns enable row level security;
alter table cards enable row level security;

create policy "public read columns" on columns for select using (true);
create policy "public write columns" on columns for all using (true);

create policy "public read cards" on cards for select using (true);
create policy "public write cards" on cards for all using (true);
```

Pronto. Abra `http://localhost:3000`.
