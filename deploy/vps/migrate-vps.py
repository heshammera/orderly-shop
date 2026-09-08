from pathlib import Path
import subprocess, hashlib, sys
root=Path('/opt/orderly-shop/app')
def sql(text):
    return subprocess.run(['docker','exec','-i','supabase-db','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-X','-q'],input=text,text=True,capture_output=True)
r=sql('CREATE SCHEMA IF NOT EXISTS orderly_deploy; CREATE TABLE IF NOT EXISTS orderly_deploy.migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz DEFAULT now());')
if r.returncode: raise SystemExit(r.stderr)
files=sorted((root/'supabase/migrations').glob('20*.sql'))
# Two files dated 2025 are duplicate ALTERs; the correct 2026 versions run after table creation.
files=[f for f in files if not f.name.startswith('2025')]
files += [root/'sql'/n for n in ['addons_system.sql','ai_features_migration.sql','full_addons_seed.sql','seed_ai_addon.sql','landing_pages_migration.sql','change_admin_password_rpc.sql','admin_advanced_stats.sql','20260308000000_get_unverified_user.sql']]
final=root/'supabase/migrations/20260909000000_complete_fresh_install.sql'
files=[f for f in files if f!=final]+[final]
for f in files:
    name=f.name
    data=f.read_text(encoding='utf-8-sig')
    check=sql("SELECT name FROM orderly_deploy.migrations WHERE name='"+name+"';")
    if name in check.stdout: continue
    checksum=hashlib.sha256(data.encode()).hexdigest()
    # Never activate the upstream publicly documented bootstrap administrator.
    if name=='20260212130000_create_super_admins.sql':
        data=data.replace("crypt('password123', gen_salt('bf'))", "crypt(encode(gen_random_bytes(48), 'hex'), gen_salt('bf'))")
    if name=='20260207113000_fix_store_members_fk.sql':
        data=data.replace('store_members_user_id_fkey', 'store_members_profile_user_id_fkey').replace('public.profiles (id)', 'public.profiles (user_id)')
    if name=='20260311000000_create_platform_tracking.sql':
        data=data.replace('WHERE super_admins.user_id = auth.uid()', "WHERE false -- Separate super-admin sessions use server-side service_role access")
    r=sql('BEGIN;\n'+data+"\nINSERT INTO orderly_deploy.migrations(name,checksum) VALUES ('"+name+"','"+checksum+"');\nCOMMIT;")
    if r.returncode:
        print('FAILED '+name,flush=True)
        print(r.stderr[-4000:],flush=True)
        sys.exit(1)
    print('OK '+name,flush=True)
print('Versioned migrations completed.')
