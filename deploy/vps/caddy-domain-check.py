from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse,parse_qs,urlencode
from urllib.request import Request,urlopen
from pathlib import Path
import re,json

env=dict(x.split('=',1) for x in Path('/opt/orderly-shop/app.env').read_text().splitlines() if '=' in x)
reserved={'www','app','api','admin','dashboard','cdn','static','assets','public','domains','mail','smtp','ftp','supabase'}
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url=urlparse(self.path)
        host=parse_qs(url.query).get('domain',[''])[0].lower()
        status=403
        if url.path=='/check':
            if host in {'orderlyshops.com','www.orderlyshops.com','api.orderlyshops.com','n8n.orderlyshops.com'}:
                status=200
            elif host.endswith('.orderlyshops.com'):
                slug=host.removesuffix('.orderlyshops.com')
                if re.fullmatch(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?',slug) and slug not in reserved:
                    try:
                        query=urlencode({'slug':'eq.'+slug,'select':'id','limit':'1'})
                        key=env['SUPABASE_SERVICE_ROLE_KEY']
                        request=Request('http://127.0.0.1:8000/rest/v1/stores?'+query,headers={'apikey':key,'Authorization':'Bearer '+key})
                        with urlopen(request,timeout=3) as response: rows=json.loads(response.read())
                        if rows: status=200
                    except Exception: status=503
        self.send_response(status); self.end_headers()
    def log_message(self,*args): pass

ThreadingHTTPServer(('127.0.0.1',9123),Handler).serve_forever()
