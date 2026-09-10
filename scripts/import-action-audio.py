import json, re, shutil
from pathlib import Path
root=Path(r'E:\AI\game_sound\sounds')
out=Path('dist/assets/sfx/action');out.mkdir(exist_ok=True)
cards=json.loads(Path('dist/cards.json').read_text(encoding='utf-8'))
manifest={'cards':{},'abilities':{},'samples':{},'sources':{}}
def add(path,kind,key):
 ident=kind+'-'+key;name='action/'+ident+path.suffix
 shutil.copy2(path,out/(ident+path.suffix))
 manifest['samples'][ident]=name;manifest['sources'][ident]=str(path.relative_to(root)).replace('\\','/')
 return ident
def entry(table,key,path):
 manifest[table][key]={'effect':add(path,table,key)}
spells=root/'effects/set_01/spells';abilities=root/'effects/set_01/abilities';items=root/'effects/set_01/items';strategies=root/'effects/set_01/strategies';creeps=root/'effects/set_01/creeps'
aliases={'no_accident':'no_accident_impact','sow_venom':'sow_venom_cast_01','winters_curse':'winters_curse_cast','mystic_flare':'mystic_flare_cast','rumusque_blessing':'rumesque_blessing','heartstopper_aura':'heartstopper_aura_cast','kraken_shell':'kraken','bellow':'bellow_cast','coup_de_grace':'coupdegrace','strafing_run':'straifing_run','annihilation':'annihlate','chain_frost':'chain_frost_cast','duel':'duel_intro','allseeing_ones_favor':'all_seeing_ones_favor','bolt_of_damocles':'bolt_of_damocles_card','dimensional_portal':'dimensional_portal_blast','remote_detonation':'remote_detonition_cast','gank':'gank_intro'}
hero={'winter_wyvern':'arctic_burn','abaddon':'borrowed_time','chen':'holy_persuasion_cast','tidehunter':'ravage','tinker':'tinker_laser','beastmaster':'call_of_the_wild','earthshaker':'fissure','lich':'dark_ritual','omniknight':'purification_cast','pugna':'nether_blast','sniper':'musket_shot','lion':'finger_of_death','skywrath_mage':'concussive_shot_blast','dark_seer':'surge','ravenhook':'ravenhook_active','ravenous_mass':'ravenous_mass'}
equipment={slot:add(root/('effects/set_00/items/'+name+'.wav'),'equipment',slot.lower()) for slot,name in {'Weapon':'weapon_mid_01','Armor':'armor_generic','Accessory':'accessory_mid_01'}.items()}
for name,source in {'hero-death':'cards/hero_death_impact_01.wav','hero-return':'cards/hero_death_to_fountain_01.wav','tower-hit':'structures/damage_impact_01.wav','tower-fall-radiant':'structures/radiant_tower_destruction_final.wav','tower-fall-dire':'structures/dire_tower_destruction_final.wav'}.items():add(root/source,'event',name)
for c in cards:
 k=c['key'];typ=c['type']
 if typ=='Item' and c.get('itemType') in equipment:manifest['cards'][k]={'effect':equipment[c['itemType']],'shared':True,'label':{'Weapon':'武器装备','Armor':'护甲装备','Accessory':'饰品装备'}[c['itemType']]}
 if typ=='Spell':
  p=spells/(aliases.get(k,k)+'.wav')
  if p.exists():entry('cards',k,p)
 if typ=='Item' and c.get('itemType')=='Consumable':
  p=root/'effects/set_00/items'/({'town_portal_scroll':'town_portal','shop_deed':'shop_deed_activate'}.get(k,k)+'.wav')
  if p.exists():entry('cards',k,p)
 if typ=='Creep':
  # Use explicitly named summon clips only, not ongoing/passive effect loops.
  p=creeps/(k+'_deploy.wav')
  if p.exists():entry('cards',k,p)
 if c.get('abilities'):
  p=abilities/(hero.get(k,k)+'.wav')
  if not p.exists() and typ=='Item':p=items/(k+'.wav')
  if not p.exists() and typ=='Improvement':p=strategies/({'aghanims_sanctum':'aghanim_sanctum','steam_cannon':'steam_cannon_fire'}.get(k,k)+'.wav')
  if not p.exists() and k=='sniper':p=spells/'headshot.wav'
  if not p.exists() and k=='book_of_the_dead':p=creeps/'book_of_the_dead_trigger.wav'
  if p.exists():entry('abilities',k,p)
 if typ=='Hero' and c.get('abilities'):
  p=root/'responses/set_01'/k/(k+'_use_ability_01.mp3')
  if p.exists():manifest['abilities'].setdefault(k,{})['voice']=add(p,'voice-ability',k)
 # Only exact named signature lines, not arbitrary character conversation.
 owner=c.get('signatureOf')
 if owner:
  voiceRoot=root/'responses/set_01'/owner
  voice=next((voiceRoot/(owner+'_'+k+suffix+'.mp3') for suffix in ['', '_intro'] if (voiceRoot/(owner+'_'+k+suffix+'.mp3')).exists()),None)
  if voice:
   manifest['cards'].setdefault(k,{})['voice']=add(voice,'voice',k)
manifest['unmatchedAbilities']=[c['key'] for c in cards if c.get('abilities') and c['key'] not in manifest['abilities']]
manifest['unmatchedSpells']=[c['key'] for c in cards if c['type']=='Spell' and not manifest['cards'].get(c['key'],{}).get('effect')]
Path('dist/action-audio.js').write_text('/* Explicit action-to-resource mapping. Regenerate with scripts/import-action-audio.py. */\nwindow.ARTIFACT_ACTION_AUDIO='+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
Path('dist/assets/sfx/action-sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('cards',len(manifest['cards']),'abilities',len(manifest['abilities']),'voices',sum('voice' in x for x in manifest['cards'].values()),'files',len(manifest['samples']),'MB',round(sum(p.stat().st_size for p in out.iterdir())/1024**2,1))
print('unmatched hero abilities',[c['key'] for c in cards if c['type']=='Hero' and c.get('abilities') and c['key'] not in manifest['abilities']])
