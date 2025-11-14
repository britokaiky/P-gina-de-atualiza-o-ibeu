
-- Tabelas
create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "order" integer not null
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  column_id uuid references columns(id) on delete cascade,
  "order" integer not null,
  page_tag text
);

-- Tabela de usuários
create table if not exists usuario_feedz (
  id int8 primary key generated always as identity,
  nome varchar,
  login varchar,
  senha varchar,
  email varchar not null,
  tipo varchar,
  created_at timestamptz not null default now()
);

-- Dados iniciais
insert into columns (title, "order") values
('Entregas planejadas', 0),
('Em desenvolvimento', 1),
('Lançamentos recentes', 2);
