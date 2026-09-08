from pathlib import Path
import json,re,shutil
root=Path('/opt/orderly-shop')
keyfile=root/'secrets/google-service-account.json'
credentials=json.loads(keyfile.read_text(encoding='utf-8-sig'))
assert credentials.get('type')=='service_account'
assert credentials.get('client_email','').endswith('.iam.gserviceaccount.com')
assert 'BEGIN PRIVATE KEY' in credentials.get('private_key','')
env=root/'app.env'
backup=root/'secrets/app.env.before-google'
if not backup.exists(): shutil.copy2(env,backup)
data=env.read_text()
updates={'GOOGLE_SERVICE_ACCOUNT_JSON':json.dumps(credentials,separators=(',',':')),'NEXT_PUBLIC_GOOGLE_SERVICE_EMAIL':credentials['client_email']}
for key,value in updates.items():
    line=key+'='+value
    if re.search(r'^'+key+'=',data,re.M):
        data=re.sub(r'^'+key+r'=.*$',lambda m:line,data,flags=re.M)
    else: data=data.rstrip('\n')+'\n'+line+'\n'
env.write_text(data);env.chmod(0o600);keyfile.chmod(0o600)
print('Google service account configured; private key not displayed.')
