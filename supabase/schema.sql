-- =====================================================================
-- BABY SHOWER ISABELLA — esquema completo. Ejecutar UNA vez en Supabase > SQL Editor.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);

create table public.invitados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  telefono text,
  token_hash text not null unique,
  utilizado boolean not null default false,
  fecha_registro timestamptz not null default now(),
  fecha_giro timestamptz
);

create table public.regalos (
  id int generated always as identity primary key,
  nombre text not null unique,
  etiqueta text,                       -- texto corto que se ve en la ruleta
  descripcion text,
  imagen text,
  activo boolean not null default true,
  cantidad_disponible int not null default 5 check (cantidad_disponible >= 0)
);

create table public.resultados (
  id uuid primary key default gen_random_uuid(),
  invitado_id uuid not null unique references public.invitados(id) on delete cascade,
  regalo_id int not null references public.regalos(id),
  fecha_asignacion timestamptz not null default now()
);
create index resultados_regalo_idx on public.resultados(regalo_id);

-- ---------- Seguridad: nadie público toca las tablas ----------
alter table public.admins enable row level security;
alter table public.invitados enable row level security;
alter table public.regalos enable row level security;
alter table public.resultados enable row level security;
revoke all on public.admins, public.invitados, public.regalos, public.resultados from anon, authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;

-- Solo administradores (usuarios en la tabla admins) pueden leer/editar:
grant select, delete on public.invitados to authenticated;
grant update (nombre, telefono) on public.invitados to authenticated;   -- no pueden tocar "utilizado"
grant select, insert, update, delete on public.regalos to authenticated;
grant usage, select on sequence public.regalos_id_seq to authenticated;
grant select on public.resultados to authenticated;

create policy adm_invitados_sel on public.invitados for select to authenticated using (public.is_admin());
create policy adm_invitados_upd on public.invitados for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy adm_invitados_del on public.invitados for delete to authenticated using (public.is_admin());
create policy adm_regalos_all on public.regalos for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy adm_resultados_sel on public.resultados for select to authenticated using (public.is_admin());

-- ---------- Funciones públicas (el invitado SOLO puede usar estas) ----------
create or replace function public.listar_regalos() returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre, 'etiqueta', coalesce(etiqueta, nombre)) order by id), '[]'::jsonb)
  from public.regalos where activo and cantidad_disponible > 0
$$;

create or replace function public.validar_token(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare inv public.invitados; g public.regalos;
begin
  select * into inv from public.invitados where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if not found then return jsonb_build_object('valido', false); end if;
  if inv.utilizado then
    select rg.* into g from public.resultados r join public.regalos rg on rg.id = r.regalo_id where r.invitado_id = inv.id;
    return jsonb_build_object('valido', true, 'nombre', inv.nombre, 'ya_giro', true, 'regalo', jsonb_build_object('id', g.id, 'nombre', g.nombre));
  end if;
  return jsonb_build_object('valido', true, 'nombre', inv.nombre, 'ya_giro', false);
end $$;

-- Operación ATÓMICA: valida token, elige regalo, descuenta cantidad, guarda resultado, marca usado.
create or replace function public.girar_ruleta(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare inv public.invitados; g public.regalos;
begin
  perform pg_advisory_xact_lock(727001);   -- serializa los giros: evita duplicados y sobreasignación
  select * into inv from public.invitados
    where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') for update;
  if not found then raise exception 'token_invalido'; end if;
  if inv.utilizado then
    select rg.* into g from public.resultados r join public.regalos rg on rg.id = r.regalo_id where r.invitado_id = inv.id;
    return jsonb_build_object('ya_giro', true, 'regalo', jsonb_build_object('id', g.id, 'nombre', g.nombre));
  end if;
  select * into g from public.regalos where activo and cantidad_disponible > 0 order by random() limit 1;
  if not found then raise exception 'sin_regalos'; end if;
  update public.regalos set cantidad_disponible = cantidad_disponible - 1 where id = g.id;
  insert into public.resultados (invitado_id, regalo_id) values (inv.id, g.id);
  update public.invitados set utilizado = true, fecha_giro = now() where id = inv.id;
  return jsonb_build_object('ya_giro', false, 'regalo', jsonb_build_object('id', g.id, 'nombre', g.nombre));
end $$;

grant execute on function public.listar_regalos(), public.validar_token(text), public.girar_ruleta(text) to anon, authenticated;

-- ---------- Funciones de administrador ----------
create or replace function public.crear_invitado(p_nombre text, p_telefono text default null) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare t text;
begin
  if not public.is_admin() then raise exception 'no_autorizado'; end if;
  t := encode(gen_random_bytes(16), 'hex');   -- 128 bits de entropía; solo se guarda el hash
  insert into public.invitados (nombre, telefono, token_hash)
    values (trim(p_nombre), nullif(trim(p_telefono), ''), encode(digest(t, 'sha256'), 'hex'));
  return t;
end $$;

create or replace function public.regenerar_token(p_id uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare t text;
begin
  if not public.is_admin() then raise exception 'no_autorizado'; end if;
  t := encode(gen_random_bytes(16), 'hex');
  update public.invitados set token_hash = encode(digest(t, 'sha256'), 'hex') where id = p_id;
  return t;
end $$;

revoke all on function public.crear_invitado(text, text), public.regenerar_token(uuid) from public, anon;
grant execute on function public.crear_invitado(text, text), public.regenerar_token(uuid) to authenticated;

-- ---------- Regalos iniciales (ajusta cantidades en Table Editor) ----------
insert into public.regalos (nombre, etiqueta) values
 ('Pañales RN – paquete de 50 unidades','Pañales RN x50'),
 ('Pañales etapa 1 – paquete de 50 unidades','Pañales etapa 1 x50'),
 ('Pañales etapa 2 – paquete de 50 unidades','Pañales etapa 2 x50'),
 ('Pañales etapa 3 – paquete de 50 unidades','Pañales etapa 3 x50'),
 ('Pañitos húmedos','Pañitos húmedos'),
 ('Crema antipañalitis','Crema antipañal'),
 ('Shampoo para bebé','Shampoo bebé'),
 ('Jabón líquido para bebé','Jabón líquido'),
 ('Crema hidratante infantil','Crema hidratante'),
 ('Algodón para bebé','Algodón'),
 ('Bodies','Bodies'),
 ('Pijamas','Pijamas'),
 ('Conjunto de ropa','Conjunto de ropa'),
 ('Medias y gorritos','Medias y gorritos'),
 ('Cobija','Cobija'),
 ('Toallas para bebé','Toallas bebé'),
 ('Muselinas','Muselinas'),
 ('Cambiador portátil','Cambiador portátil'),
 ('Biberones','Biberones'),
 ('Baberos','Baberos');
