import {normalizeSettings,migrateSettings} from './settings-migration.js';
import {MESSAGE_KEYS} from './messages.js';
import {ALL,NAMES} from './languages.js';
import {PROVIDERS,DEFAULTS,profile,language,splitText,translateOne,translateBatch,LRU} from './core.js';
const cache=new LRU(),controllers=new Map();let active=0;const waiting=[];
chrome.storage.local.setAccessLevel?.({accessLevel:'TRUSTED_CONTEXTS'});
let uiCache;async function uiDictionary(config){const s=config||await settings(),code=s.appLanguage||'en';if(uiCache?.code===code)return uiCache.dict;const dict=await(await fetch(chrome.runtime.getURL('locales/'+code+'.json'))).json();uiCache={code,dict};return dict;}
async function settings(){return normalizeSettings((await chrome.storage.local.get('settings')).settings);}
async function publicSettings(s,revision){const ui=await uiDictionary(s);let providerName=PROVIDERS[s.provider]?.name||s.provider;if(['bing','google'].includes(s.provider))providerName=providerName.replace('Free',ui.free||'Free');const locale=s.appLanguage||'en';let names;try{names=new Intl.DisplayNames([locale],{type:'language'});}catch{}const languageName=code=>code==='auto'?(ui.auto||'Auto detect'):(()=>{try{return names?.of(code)||NAMES[code]||code;}catch{return NAMES[code]||code;}})();return {provider:s.provider,providerName,source:s.source,target:s.target,sourceName:languageName(s.source),targetName:languageName(s.target),bilingual:s.bilingual,dynamic:s.dynamic,appLanguage:s.appLanguage,theme:s.theme,revision};}
async function publicSnapshot(){const data=await chrome.storage.local.get(['settings','settingsRevision']);return publicSettings(normalizeSettings(data.settings),data.settingsRevision||0);}
async function notifySettings(data){const tabs=await chrome.tabs.query({});await Promise.allSettled(tabs.filter(tab=>Number.isInteger(tab.id)).map(tab=>chrome.tabs.sendMessage(tab.id,{type:'settings-updated',settings:data})));}
let settingsWrite=Promise.resolve();function storeSettings(change){const job=settingsWrite.then(async()=>{const previous=await settings(),next=normalizeSettings(change(previous)),stored=await chrome.storage.local.get('settingsRevision'),revision=(stored.settingsRevision||0)+1;await chrome.storage.local.set({settings:next,settingsRevision:revision});if(JSON.stringify(previous)!==JSON.stringify(next))cache.clear();if(previous.appLanguage!==next.appLanguage)await refreshMenus();const published=await publicSettings(next,revision);notifySettings(published).catch(()=>{});return next;});settingsWrite=job.catch(()=>{});return job;}

function trusted(sender){return sender.id===chrome.runtime.id&&sender.url?.startsWith(chrome.runtime.getURL(''));}
async function slot(signal){
  if(signal.aborted)throw Error('Dibatalkan.');
  if(active<4){active++;return;}
  if(waiting.length>=12)throw Error('Antrean penuh. Tunggu halaman lain selesai.');
  await new Promise((resolve,reject)=>{const entry={resolve:()=>{signal.removeEventListener('abort',abort);resolve();},reject};const abort=()=>{const i=waiting.indexOf(entry);if(i>=0)waiting.splice(i,1);reject(Error('Dibatalkan.'));};waiting.push(entry);signal.addEventListener('abort',abort,{once:true});});
}
function release(){const next=waiting.shift();if(next)next.resolve();else active--;}
function cancel(tabId){for(const [id,v] of controllers)if(v.tabId===tabId){v.controller.abort();controllers.delete(id);}}
async function runTranslation(msg,sender){
  if(typeof msg.text!=='string'||!msg.text.trim()||msg.text.length>12000)throw Error('Teks kosong atau lebih dari 12.000 karakter.');
  const s=await settings();if(msg.config){for(const key of ['provider','source','target'])if(typeof msg.config[key]==='string')s[key]=msg.config[key];}
  const tabId=sender.tab?.id??'options';const controller=new AbortController(),id=crypto.randomUUID();controllers.set(id,{tabId,controller,provider:s.provider});const timer=setTimeout(()=>controller.abort(),26000);
  let held=false;
  try {
    await slot(controller.signal);held=true;
    const p=profile(s);s.format=msg.format==='html'?'html':'text';const key=JSON.stringify([s.provider,p.endpoint,p.model,s.source,s.target,s.format,msg.text]);const hit=cache.get(key);if(hit!==undefined)return {text:hit,provider:s.provider,cached:true};
    // Never split a numbered HTML marker across requests. Page blocks are bounded at 12k.
    const pieces=s.format==='html'?[msg.text]:splitText(msg.text,p.kind==='google'||p.kind==='bing'?1400:5000);let result=[],used=s.provider;
    for(const piece of pieces){
      try{result.push(await translateOne(piece,s,controller.signal));}
      catch(err){if(s.fallback&&s.provider==='bing'&&!controller.signal.aborted){result.push(await translateOne(piece,{...s,provider:'google'},controller.signal));used='google (fallback)';}else throw err;}
    }
    const text=result.join('\n');if(controller.signal.aborted)throw Error('Dibatalkan atau timeout.');cache.set(key,text);return{text,provider:used};
  } finally{clearTimeout(timer);controllers.delete(id);if(held)release();}
}
async function runBatch(msg,sender){
  const texts=msg.texts;if(!Array.isArray(texts)||!texts.length||texts.length>24||texts.some(x=>typeof x!=='string'||!x.trim()||x.length>12000)||texts.reduce((n,x)=>n+x.length,0)>16000)throw Error('Batch tidak valid atau terlalu besar.');
  const s=await settings();if(msg.config)for(const k of ['provider','source','target'])if(typeof msg.config[k]==='string')s[k]=msg.config[k];s.format='html';
  
  const p=profile(s),results=new Array(texts.length),missing=new Map();
  for(let i=0;i<texts.length;i++){const key=JSON.stringify([s.provider,p.endpoint,p.model,s.source,s.target,'html',texts[i]]),hit=cache.get(key);if(hit!==undefined)results[i]={text:hit,provider:s.provider,cached:true};else{let item=missing.get(key);if(!item){item={key,text:texts[i],indices:[]};missing.set(key,item);}item.indices.push(i);}}
  if(!missing.size)return results;
  const tabId=sender.tab?.id??'options',controller=new AbortController(),id=crypto.randomUUID();controllers.set(id,{tabId,controller,provider:s.provider});let held=false;const timer=setTimeout(()=>controller.abort(),26000);
  try{
    await slot(controller.signal);held=true;const items=[...missing.values()];let translated,used=s.provider;
    try{translated=await translateBatch(items.map(x=>x.text),s,controller.signal);}
    catch(e){if(s.provider==='bing'&&s.fallback&&!controller.signal.aborted){translated=await translateBatch(items.map(x=>x.text),{...s,provider:'google'},controller.signal);used='google (fallback)';}else throw e;}
    if(controller.signal.aborted)throw Error('Dibatalkan atau timeout.');
    for(let i=0;i<items.length;i++){cache.set(items[i].key,translated[i]);for(const index of items[i].indices)results[index]={text:translated[i],provider:used};}return results;
  }finally{clearTimeout(timer);controllers.delete(id);if(held)release();}
}
async function inject(tabId){await chrome.scripting.executeScript({target:{tabId},files:['page-engine.js','content.js']});}
async function command(tabId,action,text){await inject(tabId);return chrome.tabs.sendMessage(tabId,{type:'command',action,text});}
async function refreshMenus(){const ui=await uiDictionary();chrome.contextMenus.removeAll(()=>{chrome.contextMenus.create({id:'selection',title:ui.selection,contexts:['selection']});chrome.contextMenus.create({id:'page',title:ui.page+' — Alibasa',contexts:['page']});});}

chrome.runtime.onInstalled.addListener(()=>migrateSettings().then(refreshMenus).catch(()=>{}));
chrome.contextMenus.onClicked.addListener((info,tab)=>{if(tab?.id)command(tab.id,info.menuItemId==='selection'?'selection':'page',info.selectionText).catch(()=>{});});
chrome.commands.onCommand.addListener(async name=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(tab?.id)command(tab.id,name==='translate-page'?'page':'selection').catch(()=>{});});
chrome.tabs.onRemoved.addListener(cancel);
chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
  if(sender.id!==chrome.runtime.id)return;
  (async()=>{
    switch(msg?.type){
      case 'translate':return runTranslation(msg,sender);
      case 'translate-batch':return runBatch(msg,sender);
      case 'public-ui':return uiDictionary();
      case 'open-options':{try{if(!chrome.action.openPopup)throw Error('Popup API unavailable');await chrome.action.openPopup({windowId:sender.tab?.windowId});}catch{await chrome.windows.create({url:chrome.runtime.getURL('popup.html')+(sender.tab?.id?'?targetTab='+sender.tab.id:''),type:'popup',width:480,height:780});}return true;}
      case 'public-settings':return publicSnapshot();
      case 'overlay-visibility-changed':return true;
      case 'overlay-state':case 'toggle-overlay':{if(!trusted(sender))throw Error('Tidak diizinkan.');if(!Number.isInteger(msg.tabId))throw Error('No tab is available.');return chrome.tabs.sendMessage(msg.tabId,{type:'overlay-visibility',action:msg.type==='toggle-overlay'?'toggle':'status'});}
      case 'cancel':cancel(sender.tab?.id??msg.tabId);return true;
      case 'settings':if(!trusted(sender))throw Error('Tidak diizinkan.');return settings();
      case 'set-preferences':{if(!trusted(sender))throw Error('Not authorized.');const p=msg.preferences;if(!p||typeof p!=='object'||Object.keys(p).some(k=>!['provider','source','target','bilingual'].includes(k)))throw Error('Invalid preferences.');if(p.provider!==undefined&&!PROVIDERS[p.provider])throw Error('Invalid provider.');if(p.source!==undefined)language(p.source,true);if(p.target!==undefined)language(p.target);if(p.bilingual!==undefined&&typeof p.bilingual!=='boolean')throw Error('Invalid display setting.');return storeSettings(previous=>({...previous,...p}));}
      case 'save-settings':{
        if(!trusted(sender))throw Error('Tidak diizinkan.');const s=msg.settings;if(s.theme!==undefined&&!['system','light','dark'].includes(s.theme))throw Error('Invalid theme.');if(!ALL.includes(s.appLanguage||'en'))throw Error('Invalid app language.');
        if(!PROVIDERS[s.provider])throw Error('Provider tidak valid.');language(s.source,true);language(s.target);
        await storeSettings(()=>normalizeSettings(s));return true;
      }
      case 'clear-cache':if(!trusted(sender))throw Error('Tidak diizinkan.');cache.clear();return true;
      case 'action':if(!trusted(sender))throw Error('Tidak diizinkan.');if(!['page','selection','restore','stop','status'].includes(msg.action))throw Error('Aksi tidak valid.');if(msg.action==='stop'||msg.action==='restore')cancel(msg.tabId);return command(msg.tabId,msg.action,msg.text);
      case 'test':if(!trusted(sender))throw Error('Tidak diizinkan.');return runTranslation({text:'Hello world.'},sender);
      default:throw Error('Pesan tidak dikenal.');
    }
  })().then(data=>respond({ok:true,data})).catch(err=>respond({ok:false,error:err.name==='AbortError'?'Dibatalkan atau timeout.':err.message}));return true;
});

