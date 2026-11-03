import pathlib,zipfile,json
project=pathlib.Path(__file__).resolve().parent.parent
root=project/'extension'
dist=project/'dist'
dist.mkdir(exist_ok=True)
m=json.loads((root/'manifest.json').read_text(encoding='utf-8'));version=m['version']
assert m['permissions']==['activeTab','scripting','storage','contextMenus']
assert len(m['host_permissions'])==2
for suffix,store in [('chrome',False),('webstore',True)]:
 target=dist/f'Alibasa-{version}-{suffix}.zip'
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in sorted(root.rglob('*')):
   if not p.is_file() or 'tests' in p.relative_to(root).parts or p.name=='package.json':continue
   rel=p.relative_to(root).as_posix()
   if store and rel=='manifest.json':
    manifest=dict(m);manifest.pop('key',None);z.writestr(rel,json.dumps(manifest,indent=2))
   else:z.write(p,rel)
 with zipfile.ZipFile(target) as z:
  assert not any('oauth' in n or 'subscription' in n for n in z.namelist())
 print(target,target.stat().st_size)
