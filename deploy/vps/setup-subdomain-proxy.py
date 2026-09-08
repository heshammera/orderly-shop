from pathlib import Path
import shutil,re,subprocess
root=Path('/opt/orderly-shop')
nginx=Path('/etc/nginx/sites-available/orderly')
backup=root/'nginx-before-subdomains.conf'
if not backup.exists(): shutil.copy2(nginx,backup)
old=backup.read_text()
# Preserve all existing app/API routes and rate limiting behind Caddy.
start=old.index('server {\n    server_name orderlyshops.com www.orderlyshops.com;')
end=old.index('\nserver {\n    if ($host = www.orderlyshops.com)',start)
sites=old[start:end]
sites=sites.replace('server_name orderlyshops.com www.orderlyshops.com;', 'listen 127.0.0.1:8080;\n    server_name orderlyshops.com www.orderlyshops.com *.orderlyshops.com;')
sites=sites.replace('server_name api.orderlyshops.com;', 'listen 127.0.0.1:8080;\n    server_name api.orderlyshops.com;')
sites=re.sub(r'^.*(?:listen .*443|ssl_certificate|include /etc/letsencrypt|ssl_dhparam).*\n','',sites,flags=re.M)
sites=sites.replace('proxy_set_header X-Forwarded-Proto $scheme;', 'proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;')
header='''limit_req_zone $binary_remote_addr zone=orderly_auth:10m rate=5r/m;
set_real_ip_from 127.0.0.1;
real_ip_header X-Forwarded-For;
real_ip_recursive on;
server {
    listen 127.0.0.1:8080 default_server;
    server_name _;
    return 404;
}
'''
new=header+sites
nginx.write_text(new)
try: subprocess.run(['nginx','-t'],check=True)
except:
    shutil.copy2(backup,nginx)
    raise
shutil.copy2(root/'Caddyfile','/etc/caddy/Caddyfile')
subprocess.run(['caddy','validate','--config','/etc/caddy/Caddyfile'],check=True)
subprocess.run(['systemctl','restart','nginx'],check=True)
result=subprocess.run(['systemctl','restart','caddy'])
if result.returncode:
    shutil.copy2(backup,nginx)
    subprocess.run(['systemctl','stop','caddy'])
    subprocess.run(['systemctl','restart','nginx'],check=True)
    raise SystemExit('Caddy failed; previous Nginx configuration restored.')
subprocess.run(['systemctl','enable','caddy'],check=True)
# Caddy now owns certificate renewal. Old Certbot configuration remains for rollback.
subprocess.run(['systemctl','disable','--now','certbot.timer'],check=True)
(root/'nginx-subdomains.conf').write_text(new)
print('Caddy manages HTTPS; Nginx retains existing routes on loopback port 8080.')
