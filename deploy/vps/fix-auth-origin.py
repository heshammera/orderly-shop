from pathlib import Path
import shutil,subprocess
root=Path('/opt/orderly-shop')
nginx=Path('/etc/nginx/sites-available/orderly')
conf=nginx.read_text()
location='''    # Serve the Supabase API on the working website hostname too.
    location ~ ^/supabase/(auth|rest|storage|realtime|functions)/v1(?:/|$) {
        rewrite ^/supabase/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
    location /supabase/ { return 404; }
'''
anchor='    location ~ ^/api/(auth/(register|send-otp)|admin/login)$ {'
if 'location ~ ^/supabase/' not in conf:
    assert anchor in conf
    shutil.copy2(nginx,root/'nginx-before-auth-fix.conf')
    nginx.write_text(conf.replace(anchor,location+anchor,1))
    subprocess.run(['nginx','-t'],check=True)
    subprocess.run(['systemctl','reload','nginx'],check=True)
env=root/'app.env'
data=env.read_text()
if 'NEXT_PUBLIC_SUPABASE_URL=https://api.orderlyshops.com' in data:
    shutil.copy2(env,root/'app.env.before-auth-fix')
    env.write_text(data.replace('NEXT_PUBLIC_SUPABASE_URL=https://api.orderlyshops.com','NEXT_PUBLIC_SUPABASE_URL=https://orderlyshops.com/supabase'))
    env.chmod(0o600)
for p in [root/'nginx-orderly.conf',root/'app/deploy/vps/nginx-orderly.conf']:
    s=p.read_text()
    if 'location ~ ^/supabase/' not in s:
        assert anchor in s
        p.write_text(s.replace(anchor,location+anchor,1))
print('Same-origin API configured without changing database or user records.')
