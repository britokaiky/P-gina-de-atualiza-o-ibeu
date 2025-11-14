
alter table columns enable row level security;
alter table cards enable row level security;
alter table usuario_feedz enable row level security;

create policy "public read columns" on columns for select using (true);
create policy "public write columns" on columns for all using (true);

create policy "public read cards" on cards for select using (true);
create policy "public write cards" on cards for all using (true);

-- Política para autenticação: permitir leitura apenas para login
-- Em produção, considere usar autenticação mais segura (hash de senha, JWT, etc)
create policy "allow login check" on usuario_feedz for select using (true);
