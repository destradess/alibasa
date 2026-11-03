/* Tiny on-page launcher. The translation engine is imported only after a click. */
(async() => {
  if(globalThis.LinguaLiteOverlay || window.top!==window)return;
  await globalThis.LinguaLiteI18n?.ready;const T=key=>globalThis.LinguaLiteI18n?.t(key)||key,M=text=>globalThis.LinguaLiteI18n?.message(text)||text;
  const host=document.createElement('div');host.dataset.llUi='overlay';
  host.style.cssText='all:initial!important;position:fixed!important;right:16px!important;bottom:16px!important;z-index:2147483647!important;display:block!important;';
  const shadow=host.attachShadow({mode:'open'}),style=document.createElement('style');
  style.textContent=`
    :host{--ll-bg:#faf9f6;--ll-ink:#14243b;--ll-muted:#536477;--ll-line:#d9dfe6;--ll-hover:#eef1f5;color-scheme:light;font:13px/1.45 system-ui,sans-serif;color:var(--ll-ink)}
    *{box-sizing:border-box}button{font:600 13px system-ui;cursor:pointer;border:0}
    button:focus-visible{outline:3px solid #9abce9;outline-offset:3px}button:disabled{cursor:wait;opacity:.65}
    .bar{display:flex;align-items:center;box-shadow:0 5px 24px #001f2933;border:1px solid #ffffff55;border-radius:28px;overflow:hidden;background:#14243b;color:white;opacity:.35}
    :host(:hover) .bar,.bar:focus-within,.bar[data-menu-open="true"]{opacity:1}
    .main{display:flex;align-items:center;justify-content:center;padding:10px;min-width:44px;background:transparent;color:inherit;min-height:44px}
    .symbol{width:24px;height:24px;display:block;flex-shrink:0}.more{color:inherit;background:#ffffff14;padding:12px;min-width:36px;min-height:44px;border-inline-start:1px solid #ffffff30}
    .more:hover,.main:hover{background:#ffffff20}
    .menu{font:13px/1.45 system-ui,sans-serif;position:absolute;bottom:56px;right:0;width:240px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 100px);overflow:auto;background:var(--ll-bg);border:1px solid var(--ll-line);border-radius:10px;box-shadow:0 6px 20px #001f2926;padding:10px;color:var(--ll-ink)}
    .menu[hidden]{display:none}.heading{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px}.head{font-size:13px;font-weight:650;flex-shrink:0}.language-pair{font-size:11px;color:var(--ll-muted);overflow-wrap:anywhere;min-width:0;text-align:left;border-top:1px solid var(--ll-line);margin-top:8px;padding:10px 0 0}
    .action{display:flex;align-items:center;gap:10px;text-align:start;padding:9px 8px;border-radius:5px;color:inherit;background:transparent;width:100%}.action:hover{background:var(--ll-hover)}.action-icon{width:18px;height:18px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .hint{font-size:11px;color:#62786e;padding:4px 10px}
    :host([data-theme="dark"]){color-scheme:dark;--ll-bg:#14243b;--ll-ink:#edf1f7;--ll-muted:#b0bfd1;--ll-line:#30445e;--ll-hover:#243b57;}
    @media(prefers-color-scheme:dark){:host(:not([data-theme="light"])){color-scheme:dark;--ll-bg:#14243b;--ll-ink:#edf1f7;--ll-muted:#b0bfd1;--ll-line:#30445e;--ll-hover:#243b57;}}
    @media(prefers-reduced-motion:no-preference){.bar{transition:background .15s,opacity .15s}}
  `;
  const bar=document.createElement('div');bar.className='bar';
  const main=document.createElement('button');main.type='button';main.className='main';main.title=T('page');
  const symbol=document.createElementNS('http://www.w3.org/2000/svg','svg');symbol.setAttribute('viewBox','0 0 64 64');symbol.setAttribute('class','symbol');symbol.setAttribute('aria-hidden','true');symbol.setAttribute('focusable','false');for(const [name,attrs]of [["rect",{"x":2,"y":2,"width":60,"height":60,"rx":17,"fill":"#14243b"}],["path",{"d":"M38 28h11a7 7 0 0 1 7 7v12a7 7 0 0 1-7 7h-1v6l-8-6h-2a7 7 0 0 1-7-7V35a7 7 0 0 1 7-7Z","fill":"#b8cce7"}],["path",{"d":"M18 11h16a7 7 0 0 1 7 7v17a7 7 0 0 1-7 7H23l-9 7v-8a7 7 0 0 1-3-6V18a7 7 0 0 1 7-7Z","fill":"#faf9f6"}],["path",{"d":"m19 33 7-15h2l7 15m-13-5h10","fill":"none","stroke":"#14243b","stroke-width":3.2,"stroke-linecap":"round","stroke-linejoin":"round"}],["path",{"d":"M44 36h8m-4-3v3m-3 0c0 5 2 9 7 12m-1-12c-1 5-3 9-8 12","fill":"none","stroke":"#14243b","stroke-width":1.8,"stroke-linecap":"round","stroke-linejoin":"round"}]]){const part=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [key,value]of Object.entries(attrs))part.setAttribute(key,String(value));symbol.append(part);}
  main.append(symbol);main.setAttribute('aria-label',T('page'));
  const more=document.createElement('button');more.type='button';more.className='more';more.textContent='⌃';more.setAttribute('aria-label',T('menu'));more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','ll-overlay-menu');
  const menu=document.createElement('section');menu.id='ll-overlay-menu';menu.className='menu';menu.hidden=true;menu.setAttribute('aria-label',T('menu'));
  const head=document.createElement('div');head.className='head';head.textContent='Alibasa';
  const heading=document.createElement('div');heading.className='heading';const languagePair=document.createElement('div');languagePair.className='language-pair';languagePair.textContent=T('loading');heading.append(head);menu.append(heading);
  let loading=false,engineLoad=null,state={state:'idle',done:0,total:0,message:T('ready')};
  function showError(err){main.title=M(err.message||String(err));main.setAttribute('aria-label',main.title);openMenu();}
  function update(next){state=next;const actionLabel=next.state==='running'?T('stop'):next.done>0?T('restore'):T('page');main.title=actionLabel;main.setAttribute('aria-label',actionLabel);main.dataset.state=next.state;}
  async function loadEngine(){
    if(globalThis.LinguaLiteActions)return globalThis.LinguaLiteActions;
    if(!engineLoad)engineLoad=(async()=>{await import(chrome.runtime.getURL('page-engine.js'));await import(chrome.runtime.getURL('content.js'));if(!globalThis.LinguaLiteActions)throw Error('Reload ekstensi lalu refresh halaman untuk memuat versi baru.');return globalThis.LinguaLiteActions;})().catch(e=>{engineLoad=null;throw e;});
    return engineLoad;
  }
  async function run(action){
    if(loading)return;loading=true;main.disabled=true;
    try{const actions=await loadEngine(),result=await actions.run(action);if(result?.error)throw Error(result.error);if(action==='restore')update({state:'idle',done:0,total:0,message:result.message});}
    catch(e){showError(e);}finally{loading=false;main.disabled=false;}
  }
  let settingsRevision=-1;
  function applyConfiguration(s){if(!s||typeof s.provider!=='string')return;const revision=Number.isFinite(s.revision)?s.revision:0;if(revision<settingsRevision)return;settingsRevision=revision;host.dataset.theme=s.theme||'system';languagePair.textContent=`${s.sourceName||s.source} → ${s.targetName||s.target}`;languagePair.dataset.source=s.source;languagePair.dataset.target=s.target;languagePair.dir='auto';}
  async function configuration(){try{const r=await chrome.runtime.sendMessage({type:'public-settings'});if(!r?.ok)throw Error(r?.error||'Settings unavailable.');applyConfiguration(r.data);}catch(e){languagePair.textContent=M('Refresh halaman bila ekstensi baru diperbarui.');}}
  function settingsChanged(msg,sender,reply){if(sender.id!==chrome.runtime.id)return;if(msg?.type==='overlay-visibility'){if(msg.action==='toggle')setVisible(!overlayVisible);reply({visible:overlayVisible});return;}if(msg?.type!=='settings-updated')return;applyConfiguration(msg.settings);reply({ok:true});}
  chrome.runtime.onMessage.addListener(settingsChanged);

  let overlayVisible=true;
  function setVisible(visible){closeMenu();overlayVisible=!!visible;host.style.setProperty('display',overlayVisible?'block':'none','important');chrome.runtime.sendMessage({type:'overlay-visibility-changed',visible:overlayVisible}).catch(()=>{});}
  function outside(e){if(!e.composedPath().includes(host))closeMenu();}
  function onKey(e){if(e.key==='Escape'){closeMenu();more.focus();}}
  function openMenu(){if(!host.isConnected)return;menu.hidden=false;bar.dataset.menuOpen='true';more.setAttribute('aria-expanded','true');document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',onKey,true);configuration();}
  function closeMenu(){menu.hidden=true;delete bar.dataset.menuOpen;more.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',onKey,true);}
  const actionPaths={stop:'M6 6h12v12H6Z',restore:'M4 10a8 8 0 1 1 1 8M4 4v6h6',settings:'M4 7h16M4 17h16M8 4v6M16 14v6',hide:'m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.8 5.3A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a19 19 0 0 1-3.2 3.8M6.4 6.4A20 20 0 0 0 2 12s4 7 10 7a11 11 0 0 0 5-1.3'};
  function action(text,callback,icon,extra=''){const b=document.createElement('button');b.type='button';b.className='action '+extra;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','action-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',actionPaths[icon]);svg.append(path);const label=document.createElement('span');label.textContent=text;b.append(svg,label);b.onclick=callback;menu.append(b);return b;}
  action(T('stop'),()=>run('stop'),'stop');
  action(T('restore'),()=>run('restore'),'restore');
  action(T('settings'),async()=>{try{const r=await chrome.runtime.sendMessage({type:'open-options'});if(!r?.ok)throw Error(r?.error||'Gagal membuka pengaturan.');closeMenu();}catch(e){showError(e);}},'settings');
  action(T('hide'),()=>setVisible(false),'hide','hide');
  menu.append(languagePair);
  main.onclick=()=>run(state.state==='running'?'stop':state.done>0?'restore':'page');
  more.onclick=()=>menu.hidden?openMenu():closeMenu();
  bar.append(main,more);shadow.append(style,menu,bar);document.documentElement.append(host);
  globalThis.LinguaLiteOverlay={update};configuration();
})();

