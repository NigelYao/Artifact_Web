"""Normalize public Classic snapshots and client localization into offline data.js.
Run with --source /path/to/research-input-directory (see README).
"""
import json,re,html,pathlib,argparse
root=pathlib.Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--cards',default=str(root/'research'));ap.add_argument('--localization',default=str(root/'research'));args=ap.parse_args()
base=pathlib.Path(args.cards);loc=pathlib.Path(args.localization)
def tokens(language):
 out={}
 for n in ['00','01']:
  t=(loc/f'latest_{n}_{language}.txt').read_text()
  for m in re.finditer(r'"(Card(?:Name|Text|Effect)_[^"\n]+)"\s+"((?:\\.|[^"\\])*)"',t):out[m[1]]=m[2].replace('\\"','"').replace('\\n','\n')
 return out
en=tokens('english');zh=tokens('schinese')
def clean(s,name):
 s=re.sub(r'\[abilityname\[([^\[\]]*)\]\]',r'\1 · ',s)
 for _ in range(12):
  s=re.sub(r'\[(?:[a-zA-Z_]+(?::[^\[\]]+)?)?\[([^\[\]]*)\]\]',r'\1',s)
 s=re.sub('<[^>]+>','',s)
 s=s.replace('{s:thisCardName}',name).replace('{s:parentCardName}',name).replace('[','').replace(']','')
 return html.unescape(s).replace('■','').strip()
def slug(s):return re.sub(r'[^a-z0-9]+','_',re.sub("['’’.]",'',s.lower())).strip('_')
allcards=sum([json.loads((base/f'open-set-{i}-set.json').read_text())['card_set']['card_list'] for i in range(2)],[])
ids={c['card_id']:c for c in allcards};keys={c['card_id']:slug(en.get('CardName_'+str(c['card_id']),c['card_name']['english'])) for c in allcards}
old=json.loads((loc/'cards-manifest.json').read_text())['Sets'][0]['Cards'];oldmap={slug(c['Name']):c for c in old}
sig={r['card_id']:keys[c['card_id']] for c in allcards if c['card_type']=='Hero' for r in c.get('references',[]) if r['ref_type']=='includes'}
out=[]
for c in allcards:
 if c['card_type'] not in ['Hero','Creep','Spell','Item','Improvement']:continue
 cid=c['card_id'];key=keys[cid];name=en.get(f'CardName_{cid}',c['card_name']['english']);zname=zh.get(f'CardName_{cid}',name)
 text=clean(en.get(f'CardText_{cid}',c.get('card_text',{}).get('english','')),name);zt=clean(zh.get(f'CardText_{cid}',''),zname)
 ref=[r for r in c.get('references',[]) if r['ref_type']=='active_ability'];prev=oldmap.get(key,{})
 if not text:
  passive=[r for r in c.get('references',[]) if r['ref_type']=='passive_ability']
  text=' '.join(clean(en.get(f"CardText_{r['card_id']}",ids.get(r['card_id'],{}).get('card_text',{}).get('english','')),name) for r in passive)
  zt=' '.join(clean(zh.get(f"CardText_{r['card_id']}",''),zname) for r in passive)
 abilities=[]
 for r in ref:
  a=ids.get(r['card_id'],{});aid=r['card_id'];aen=en.get(f'CardName_{aid}',a.get('card_name',{}).get('english','主动技能'));az=zh.get(f'CardName_{aid}',aen)
  at=clean(en.get(f'CardText_{aid}',a.get('card_text',{}).get('english','')),name);azt=clean(zh.get(f'CardText_{aid}',''),zname)
  cd=next((x.get('Cooldown',1) for x in prev.get('Abilities',[]) if x.get('Type')=='Active'),1)
  m=re.search(r'Active\s*(\d+)',text);cd=int(m[1]) if m else cd
  abilities.append({'name':az,'en':aen,'text':azt or at,'cooldown':cd})
 d={'id':cid,'key':key,'en':name,'name':zname,'type':c['card_type'],'color':next((x.capitalize() for x in ['red','green','blue','black'] if c.get('is_'+x)),'Neutral'),'mana':c.get('mana_cost',0),'gold':c.get('gold_cost',0),'attack':c.get('attack',0),'armor':c.get('armor',0),'health':c.get('hit_points',0),'text':zt or text,'textEn':text,'rarity':c.get('rarity','Basic'),'itemType':c.get('sub_type'),'signature':next((keys[r['card_id']] for r in c.get('references',[]) if r['ref_type']=='includes'),None),'signatureOf':sig.get(cid),'token':c['card_type']=='Creep' and not c.get('item_def') and cid not in sig,'cross':bool(prev.get('CrossLane') or 'any lane' in text or c['card_type']=='Improvement'),'initiative':'initiative' in text.lower() or bool(prev.get('GetInitiative')),'abilities':abilities,'art':f'assets/cards/{cid}.webp','artist':c.get('illustrator','')}
 out.append(d)
# Published Classic balance changes (Valve, 20 Dec 2018), not Foundry balance.
patches={'axe':{'attack':6,'health':10},'bloodseeker':{'health':7},'blood_rage':{'mana':4},'drow_ranger':{'attack':3,'health':6},'jasper_daggers':{'gold':5},'cheating_death':{'abilities':[{'name':'逃脱死亡','en':'Cheating Death','text':'本回合赋予一个单位死亡护盾；本路需要绿色友方英雄。','cooldown':1}]}}
for c in out:c.update(patches.get(c['key'],{}))
(root/'dist/data.js').write_text('/* Public Classic card metadata, localized client text and credited card art. */\nwindow.ARTIFACT_CARDS = '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
(root/'dist/cards.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print('Generated',len(out),'cards;',sum(c['type']=='Hero' for c in out),'heroes')
print('no localized name',[c['key'] for c in out if c['name']==c['en']]);print('active',[(c['key'],c['abilities'][0]['cooldown']) for c in out if c['abilities']])
