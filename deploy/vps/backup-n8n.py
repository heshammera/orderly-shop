from pathlib import Path
import sqlite3,subprocess,sys,shutil
stage=Path(sys.argv[1]);root=Path('/opt/orderly-shop/n8n')
if not root.exists():raise SystemExit(0)
mounts=__import__('json').loads(subprocess.check_output(['docker','inspect','orderly-n8n','--format','{{json .Mounts}}'],text=True))
data=Path(next(x['Source'] for x in mounts if x['Destination']=='/home/node/.n8n'))
source=sqlite3.connect('file:'+str(data/'database.sqlite')+'?mode=ro',uri=True)
target=sqlite3.connect(stage/'n8n.sqlite');source.backup(target);target.close();source.close()
shutil.copyfile(root/'.env',stage/'n8n.env');shutil.copyfile(root/'compose.yml',stage/'n8n-compose.yml')
print('n8n consistent SQLite backup included')
