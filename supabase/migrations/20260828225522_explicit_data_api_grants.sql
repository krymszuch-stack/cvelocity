-- Od 30 maja 2026 nowe projekty Supabase nie wystawiają automatycznie tabel
-- do Data API. RLS rozstrzyga, które wiersze wolno zobaczyć, ale nie zastępuje
-- przywilejów do samej tabeli. Granty poniżej są więc jawne i odpowiadają
-- dokładnie politykom z wcześniejszych migracji.

grant usage on schema public to anon, authenticated, service_role;

-- Dostęp przeglądarki. Każda z tych tabel ma RLS; brak operacji w grantach
-- odpowiada brakowi polityki dla tej operacji.
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.vaults to authenticated;
grant select, insert, update, delete on table public.applications to authenticated;
grant select on table public.plans to authenticated;
grant select on table public.subscriptions to authenticated;
grant select on table public.ai_usage_events to authenticated;
grant select on table public.usage_counters to authenticated;
grant select on table public.user_quotas to authenticated;
grant select, insert on table public.consents to authenticated;
grant select, insert, delete on table public.cv_question_skips to authenticated;
grant select, insert, delete on table public.suggestion_contributions to authenticated;
grant select on table public.user_gamification to authenticated;
grant select on table public.template_entitlements to authenticated;
grant select on table public.crowdsourced_companies to anon, authenticated;
grant select on table public.crowdsourced_job_insights to anon, authenticated;

-- Serwer Express działa kluczem service_role. Mimo że ta rola omija RLS,
-- nadal potrzebuje praw obiektowych, gdy projekt ma wyłączone automatyczne
-- wystawianie nowych tabel w Data API.
grant select, insert, update, delete on table
  public.profiles,
  public.vaults,
  public.applications,
  public.subscriptions,
  public.stripe_events,
  public.user_gamification,
  public.crowdsourced_companies,
  public.crowdsourced_job_insights,
  public.application_feedbacks,
  public.template_entitlements,
  public.client_errors
to service_role;

grant select on table
  public.plans,
  public.usage_counters,
  public.user_quotas
to service_role;

grant insert on table public.ai_usage_events to service_role;
grant usage, select on sequence public.ai_usage_events_id_seq to service_role;

-- Klucz obcy jest używany przy zmianach i usuwaniu planów. Bez indeksu każda
-- taka operacja skanuje całą tabelę subskrypcji.
create index if not exists subscriptions_plan_id_idx
  on public.subscriptions (plan_id);

-- Funkcje SECURITY DEFINER nie mogą pozostać wywoływalne przez PUBLIC.
-- Serwer przekazuje identyfikator użytkownika dopiero po weryfikacji JWT.
revoke all on function public.consume_quota(uuid, text) from public, anon, authenticated;
revoke all on function public.reserve_ai_quota(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_ai_quota(uuid) from public, anon, authenticated;
revoke all on function public.delete_user_data(uuid) from public, anon, authenticated;
revoke all on function public.activate_application_pass(uuid, integer) from public, anon, authenticated;
revoke all on function public.record_client_errors(jsonb) from public, anon, authenticated;

grant execute on function public.consume_quota(uuid, text) to service_role;
grant execute on function public.reserve_ai_quota(uuid, integer) to service_role;
grant execute on function public.refund_ai_quota(uuid) to service_role;
grant execute on function public.delete_user_data(uuid) to service_role;
grant execute on function public.activate_application_pass(uuid, integer) to service_role;
grant execute on function public.record_client_errors(jsonb) to service_role;
