(() => {
  if(globalThis.__linguaLite)return;
  globalThis.__linguaLite=true;
  const SKIP='script,style,pre,code,input,textarea,[contenteditable]:not([contenteditable="false"]),[data-ll-ui],[data-ll-output]';
  let selectionText='',bubble=null,manual=null,currentSettings=null,controlEpoch=0;
  let status={state:'idle',done:0,total:0,failed:0,waiting:0,message:'Siap'};
  async function api(type,data={}){const r=await chrome.runtime.sendMessage({type,...data});if(!r?.ok)throw Error(M(r?.error||'Service worker tidak merespons.'));return r.data;}
  function panel(){
    let host=document.querySelector('[data-ll-ui="panel"]');if(host)return host;
    host=document.createElement('div');host.dataset.llUi='panel';host.style.cssText='all:initial;position:fixed;bottom:16px;right:16px;z-index:2147483647';
    const shadow=host.attachShadow({mode:'open'}),box=document.createElement('div');box.style.cssText='font:13px system-ui;background:#12202a;color:#fff;padding:12px 14px;border-radius:12px;box-shadow:0 6px 30px #0004;max-width:350px;display:flex;gap:10px;align-items:center';
    const label=document.createElement('span');box.append(label);host._label=label;
    const stop=document.createElement('button');stop.textContent='Stop';stop.onclick=()=>halt();const close=document.createElement('button');close.textContent='×';close.onclick=()=>host.remove();box.append(stop,close);shadow.append(box);document.documentElement.append(host);return host;
  }
  const M=text=>globalThis.LinguaLiteI18n?.message(text)||text;
  function progress(next){next={...next,message:M(next.message)};status=next;if(globalThis.LinguaLiteOverlay){globalThis.LinguaLiteOverlay.update(next);return;}if(status.state==='idle')return;const h=panel();h._label.textContent=`${status.done}/${status.total} · ${status.message}${status.failed?` · ${status.failed} gagal`:''}`;}
  const engine=new globalThis.LinguaLitePage.PageEngine({translate:(text,config,format)=>api('translate',{text,config,format}),translateBatch:(texts,config)=>api('translate-batch',{texts,config}),cancel:()=>api('cancel').catch(()=>{}),status:progress});
  function halt(){controlEpoch++;engine.stop();}
  function restore(){controlEpoch++;engine.restore();document.querySelector('[data-ll-ui="panel"]')?.remove();bubble?.remove();bubble=null;manual=null;}
  async function start(){const request=++controlEpoch;currentSettings=await api('public-settings');if(request!==controlEpoch)return{message:'Dibatalkan.'};return engine.start(currentSettings);}
  function selectionResult(text){
    bubble?.remove();bubble=document.createElement('div');bubble.dataset.llUi='selection';bubble.style.cssText='all:initial;position:fixed;bottom:70px;right:16px;z-index:2147483647;max-width:min(440px,90vw)';
    const shadow=bubble.attachShadow({mode:'open'}),box=document.createElement('div');box.style.cssText='font:15px/1.65 system-ui;background:#12202a;color:#fff;border-radius:14px;padding:18px;box-shadow:0 8px 35px #0005;max-height:65vh;overflow:auto;white-space:pre-wrap';
    const result=document.createElement('div');result.dir='auto';result.textContent=text;const close=document.createElement('button');close.textContent='×';close.onclick=()=>{bubble?.remove();bubble=null;};box.append(result,close);shadow.append(box);document.documentElement.append(bubble);return result;
  }
  document.addEventListener('selectionchange',()=>{const s=getSelection();if(s?.toString().trim()&&!s.anchorNode?.parentElement?.closest(SKIP))selectionText=s.toString().trim().slice(0,12001);},{passive:true});
  async function selection(text){const config=await api('public-settings'),chosen=text||getSelection()?.toString().trim()||selectionText;if(!chosen)throw Error('Blok kata, kalimat, atau paragraf dahulu.');if(chosen.length>12000)throw Error('Pilihan maksimal 12.000 karakter.');const result=selectionResult(M('Menerjemahkan…'));try{const r=await api('translate',{text:chosen,config});result.textContent=r.text;return{message:'Pilihan diterjemahkan.'};}catch(e){result.textContent=M(e.message);throw e;}}
  async function run(action,text){switch(action){case'page':return start();case'selection':return selection(text);case'stop':halt();return{message:'Dihentikan.'};case'restore':restore();return{message:'Halaman dipulihkan.'};case'status':return status;default:throw Error('Aksi tidak dikenal.');}}
  globalThis.LinguaLiteActions={run};
  chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
    if(msg?.type!=='command')return;run(msg.action,msg.text).then(result=>reply({...result,message:M(result.message)})).catch(e=>reply({error:M(e.message)}));return true;
  });
})();

