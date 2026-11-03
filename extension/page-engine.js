/* Original DOM translation engine. No third-party runtime or remote scripts. */
(() => {
  if (globalThis.LinguaLitePage) return;
  const INLINE = new Set('A ABBR B BDI BDO BR CITE CODE KBD SAMP DEL EM I INS LABEL MARK Q S SMALL SPAN STRONG SUB SUP TIME U WBR'.split(' '));
  const ROOT_SKIP = 'script,style,noscript,pre,code,kbd,samp,svg,canvas,textarea,input,iframe,[hidden],[contenteditable]:not([contenteditable="false"]),[translate="no"],.notranslate,[data-ll-ui],[data-ll-output]';
  const FROZEN = 'code,kbd,samp,[translate="no"],.notranslate';
  const VOID = new Set(['BR','WBR']);
  const escapeText = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function decodeText(s) {
    return s.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, value => {
      const name=value.slice(1,-1).toLowerCase(), simple={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};
      if(name[0]!=='#')return simple[name];
      const n=name[1]==='x'?parseInt(name.slice(2),16):parseInt(name.slice(1),10);
      return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):'\ufffd';
    });
  }
  function parentElement(n) {return n?.parentElement || n?.getRootNode?.()?.host || null;}
  function skipped(n) {for(let e=n;e;e=parentElement(e))if(e.matches?.(ROOT_SKIP))return true;return false;}
  function sourceChildren(node) {return [...node.childNodes].filter(n=>!(n.nodeType===1&&n.hasAttribute('data-ll-output')));}
  function modelFor(root, capture=true) {
    if(root.nodeType===3){const plain=root.data,html=escapeText(plain);if(!/[\p{L}\p{N}]/u.test(plain)||!plain.trim()||plain.length>200000)return null;return{html,plain,entries:new Map(),snapshots:capture?[{node:root,text:plain}]:[],length:plain.length};}
    const entries=new Map(), snapshots=[],texts=[];let next=0,length=0,valid=true;
    function walk(node,parent=0,depth=0) {
      if(depth>24){valid=false;return '';}
      if(node.nodeType===3){const text=node.data;length+=text.length;texts.push(text);if(capture)snapshots.push({node,text});return escapeText(text);}
      if(node.nodeType===8)return '';
      if(node.nodeType!==1||!INLINE.has(node.tagName)){valid=false;return '';}
      const hidden=node.hidden||node.ownerDocument.defaultView.getComputedStyle(node).display==='none',frozen=node.matches(FROZEN)||hidden,id=++next;
      if(next>180){valid=false;return '';}
      const children=[...node.childNodes];entries.set(id,{node,parent,frozen,hidden,children});
      if(capture&&!frozen)snapshots.push({node,children});
      let text='';if(!frozen&&!VOID.has(node.tagName))for(const child of children)text+=walk(child,id,depth+1);
      return `<a${id}>${text}</a${id}>`;
    }
    const children=sourceChildren(root);if(capture)snapshots.unshift({node:root,children});
    let html='';for(const child of children)html+=walk(child);
    const plain=texts.join('');
    if(!valid||!/[\p{L}\p{N}]/u.test(plain)||plain.trim().length<1||html.length>12000||length>12000)return null;
    return {html,plain,entries,snapshots,length};
  }
  function sameSource(root,model){
    const now=modelFor(root,false);if(now?.html!==model.html)return false;
    return model.snapshots.every(s=>s.children?sourceChildren(s.node).length===s.children.length&&sourceChildren(s.node).every((n,i)=>n===s.children[i]):s.node.data===s.text);
  }
  function topology(root){const out=[];function walk(node){for(const child of sourceChildren(node)){out.push(child);if(child.nodeType===1&&!child.matches(FROZEN))walk(child);}}walk(root);return out;}
  // Parse only the numbered tag grammar. Provider HTML is never passed to innerHTML.
  function parseResult(text,model) {
    text=String(text).trim().replace(/^```(?:html|xml)?\s*/i,'').replace(/\s*```$/,'');
    if(text.length>(model.plain.length>12000?200000:50000))throw Error('Hasil terlalu panjang.');
    const root={id:0,children:[]},stack=[root],seen=new Set();let pos=0;
    while(pos<text.length){
      const lt=text.indexOf('<',pos),end=lt<0?text.length:lt;
      if(end>pos)stack.at(-1).children.push(decodeText(text.slice(pos,end)));
      if(lt<0)break;
      const match=/^<(\/?)a([1-9]\d*)\s*>/i.exec(text.slice(lt));
      if(!match)throw Error('Provider mengubah format penanda. Blok asli dipertahankan.');
      const id=Number(match[2]),entry=model.entries.get(id);
      if(!entry)throw Error('Penanda hasil tidak dikenal.');
      if(match[1]){if(stack.length===1||stack.at(-1).id!==id)throw Error('Penanda hasil tidak berpasangan.');stack.pop();}
      else {if(seen.has(id)||entry.parent!==stack.at(-1).id)throw Error('Struktur penanda berubah.');seen.add(id);const part={id,children:[]};stack.at(-1).children.push(part);stack.push(part);}
      pos=lt+match[0].length;
    }
    if(stack.length!==1||seen.size!==model.entries.size)throw Error('Penanda hilang pada hasil. Blok asli dipertahankan.');
    function check(part){for(const child of part.children)if(typeof child!=='string'){const e=model.entries.get(child.id);if((e.frozen||VOID.has(e.node.tagName))&&child.children.some(x=>typeof x!=='string'||x.trim()))throw Error('Isi elemen yang dikecualikan berubah.');check(child);}}
    check(root);return root;
  }
  function safeCopy(original,doc) {
    const el=doc.createElement(original.tagName.toLowerCase());
    for(const key of ['title','lang','dir'])if(original.hasAttribute(key))el.setAttribute(key,original.getAttribute(key));
    if(original.tagName==='A'){
      const href=original.getAttribute('href');if(href){try{const u=new URL(href,original.baseURI);if(['https:','http:','mailto:','tel:'].includes(u.protocol))el.setAttribute('href',u.href);}catch{}}
      if(original.getAttribute('target')==='_blank'){el.target='_blank';el.rel='noopener noreferrer';}
    }
    return el;
  }
  function render(tree,model,doc,reuse) {
    const fragment=doc.createDocumentFragment();
    for(const part of tree.children){
      if(typeof part==='string'){fragment.append(doc.createTextNode(part));continue;}
      const entry=model.entries.get(part.id),el=reuse?entry.node:safeCopy(entry.node,doc);
      if(!entry.frozen&&!VOID.has(el.tagName))el.replaceChildren(render(part,model,doc,reuse));
      else if(entry.frozen&&!reuse){el.textContent=entry.node.textContent;if(entry.hidden)el.hidden=true;}
      fragment.append(el);
    }
    return fragment;
  }
  function restoreSnapshot(model) {
    // Restore descendants first, then reconnect original children; identity/listeners survive.
    for(const s of [...model.snapshots].reverse())if(s.children)s.node.replaceChildren(...s.children);else s.node.data=s.text;
  }
  class PageEngine {
    constructor({translate,translateBatch,cancel=()=>{},status=()=>{}}) {
      this.translate=translate;this.translateBatch=translateBatch||((texts,config)=>Promise.all(texts.map(text=>translate(text,config,'html'))));this.cancel=cancel;this.report=status;this.records=new Map();this.hints=new Map();this.textFallback=new WeakSet();this.roots=new Set();this.rootObservers=new Map();this.frameListeners=new Map();
      this.active=false;this.running=false;this.generation=0;this.timer=null;this.scanning=null;this.rerun=false;this.retained=0;this.sourceBudget=0;this.settings={};
      this.stats={state:'idle',done:0,total:0,failed:0,skipped:0,waiting:0,message:'Siap'};
    }
    emit(message){if(message)this.stats.message=message;this.stats.waiting=0;this.report({...this.stats});}
    withOwnChanges(fn){try{return fn();}finally{for(const observer of this.rootObservers.values())observer.takeRecords();}}
    flush(){for(const observer of this.rootObservers.values()){const list=observer.takeRecords();if(list.length)this.mutations(list);}}
    disconnect(){clearTimeout(this.timer);this.timer=null;for(const observer of this.rootObservers.values())observer.disconnect();this.rootObservers.clear();for(const [frame,listener]of this.frameListeners)frame.removeEventListener('load',listener);this.frameListeners.clear();}
    stop(){this.active=false;this.generation++;this.disconnect();this.cancel();this.running=false;for(const r of this.records.values())if(r.state==='pending')r.state='new';this.stats.state='stopped';this.emit('Dihentikan');}
    prune(){for(const [node,r]of this.records)if(!node.isConnected||(node.ownerDocument!==document&&!node.ownerDocument.defaultView?.frameElement?.isConnected)){if(r.mode==='hint')this.removeHint(r);else r.output?.remove();if(r.state==='applied')this.stats.done=Math.max(0,this.stats.done-1);this.retained-=r.cost||0;this.sourceBudget-=r.sourceLength||0;this.records.delete(node);}for(const root of this.roots){const connected=root.nodeType===9?root===document||root.defaultView?.frameElement?.isConnected:root.host?.isConnected;if(!connected){this.rootObservers.get(root)?.disconnect();this.rootObservers.delete(root);this.roots.delete(root);}}for(const [frame,listener]of this.frameListeners)if(!frame.isConnected){frame.removeEventListener('load',listener);this.frameListeners.delete(frame);}} 
    restore(){this.stop();this.withOwnChanges(()=>{for(const r of this.records.values()){if(r.state==='applied'&&r.model){if(r.mode==='hint')this.removeHint(r);else if(r.mode==='bilingual')r.output?.remove();else {const current=modelFor(r.node,false);const nodes=topology(r.node);if(current?.html===r.rendered&&nodes.length===r.appliedNodes?.length&&nodes.every((n,i)=>n===r.appliedNodes[i]))restoreSnapshot(r.model);}}if(r.optionValue!==undefined&&r.node.getAttribute('value')===r.optionValue)r.node.removeAttribute('value');r.node.removeAttribute?.('data-ll-done');}});this.records.clear();this.textFallback=new WeakSet();this.roots.clear();this.retained=0;this.sourceBudget=0;this.stats={state:'idle',done:0,total:0,failed:0,skipped:0,waiting:0,message:'Asli dipulihkan'};this.emit();}
    addRoot(root){
      if(!root||this.roots.size>=24)return;this.roots.add(root);
      if(this.active&&this.settings.dynamic&&!this.rootObservers.has(root)){
        const doc=root.ownerDocument||root,Observer=doc.defaultView?.MutationObserver||MutationObserver;
        const observer=new Observer(list=>this.mutations(list));observer.observe(root,{subtree:true,childList:true,characterData:true,characterDataOldValue:true});this.rootObservers.set(root,observer);
      }
    }
    invalidate(r){
      if(r.state==='applied'){
        if(r.mode==='hint')this.removeHint(r);else if(r.mode==='bilingual')this.withOwnChanges(()=>r.output?.remove());
        this.retained-=r.cost||0;r.cost=0;r.model=null;r.output=null;r.rendered=null;r.appliedNodes=null;
        this.stats.done=Math.max(0,this.stats.done-1);
      }
      r.revision++;r.state='new';r.node.removeAttribute?.('data-ll-done');
    }
    findRecord(node){if(this.records.has(node))return this.records.get(node);for(let e=node.nodeType===1?node:node.parentElement;e;e=parentElement(e)){const r=this.records.get(e);if(r)return r;}return null;}
    mutations(list){
      if(!this.active)return;let scan=false,changed=false;const invalid=new Set();
      for(const m of list){const target=m.target.nodeType===1?m.target:m.target.parentElement;if(!target||skipped(target))continue;
        const record=this.findRecord(m.target);if(record&&(m.type==='characterData'||m.type==='childList'))invalid.add(record);
        if(m.type==='childList')scan=true;changed=true;
      }
      for(const r of invalid){this.invalidate(r);if(!modelFor(r.node,false)){this.records.delete(r.node);this.sourceBudget-=r.sourceLength;scan=true;}}
      if(!changed)return;this.prune();clearTimeout(this.timer);this.timer=setTimeout(async()=>{this.timer=null;if(!this.active)return;if(scan)await this.scan();this.pump();},350);
    }
    async scan(){
      if(this.scanning){this.rerun=true;return this.scanning;}
      const gen=this.generation;
      this.scanning=(async()=>{
        this.prune();this.addRoot(document);const covered=new WeakSet();for(const r of this.records.values())for(let parent=parentElement(r.node);parent;parent=parentElement(parent))covered.add(parent);const visited=new Set(),roots=[...this.roots];let visits=0,limited=false;
        for(let i=0;i<roots.length;i++){
          const root=roots[i];if(visited.has(root))continue;visited.add(root);this.addRoot(root);
          const doc=root.ownerDocument||root,first=root.nodeType===9?root.body:root;if(!first)continue;
          const stack=[...first.childNodes].reverse();
          // A body consisting only of direct text is rare; normal containers are handled below.
          while(stack.length){
            if(++visits%300===0){await new Promise(r=>setTimeout(r,0));if(gen!==this.generation)return;}
            if(visits>50000||this.records.size>=1200||this.sourceBudget>=750000){limited=true;break;}
            const el=stack.pop();
            if(el.nodeType===3){const parent=el.parentElement||el.getRootNode()?.host;if(!parent||skipped(parent)||this.records.has(el))continue;const style=parent.ownerDocument.defaultView.getComputedStyle(parent);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')continue;const candidate=modelFor(el,false);if(candidate){this.sourceBudget+=candidate.length;this.records.set(el,{node:el,state:'new',revision:0,sourceLength:candidate.length,cost:0});}continue;}
            if(el.nodeType!==1||el.matches('[data-ll-ui],[data-ll-output]'))continue;
            if(el.tagName==='IFRAME'){
              try{const child=el.contentDocument;if(child?.body&&!visited.has(child)&&this.roots.size<24){this.addRoot(child);roots.push(child);}}catch{}
              if(!this.frameListeners.has(el)&&this.frameListeners.size<24){const listener=()=>{if(this.active){this.scan().then(()=>this.pump());}};el.addEventListener('load',listener);this.frameListeners.set(el,listener);}continue;
            }
            if(skipped(el))continue;const style=el.ownerDocument.defaultView.getComputedStyle(el);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')continue;
            if(el.shadowRoot?.mode==='open'&&!visited.has(el.shadowRoot)&&this.roots.size<24){this.addRoot(el.shadowRoot);roots.push(el.shadowRoot);}
            if(this.records.has(el))continue;
            let textOnly=false;for(let parent=el;parent;parent=parentElement(parent))if(this.textFallback.has(parent)){textOnly=true;break;}
            const candidate=textOnly||covered.has(el)?null:modelFor(el,false);
            if(candidate){
              const r={node:el,state:'new',revision:0,sourceLength:candidate.length,cost:0};
              this.sourceBudget+=candidate.length;this.records.set(el,r);continue;
            }
            if(!el.matches(ROOT_SKIP))stack.push(...[...el.childNodes].reverse());
          }
          if(limited)break;
        }
        this.stats.total=this.records.size;if(limited)this.stats.limited=true;this.emit();
      })();
      try{await this.scanning;}finally{this.scanning=null;if(this.rerun&&this.active){this.rerun=false;setTimeout(()=>{if(this.active)this.scan().then(()=>this.pump());},350);}}
    }
    async start(settings){
      if(this.active&&this.running)return{message:'Terjemahan masih berjalan.'};
      const identity=s=>JSON.stringify([s.provider,s.source,s.target,s.bilingual]);
      if(this.records.size&&identity(this.settings)!==identity(settings))this.restore();
      this.disconnect();this.settings={...settings};for(const r of this.records.values()){if(r.state==='failed')r.state='new';if(r.state==='applied'){const now=modelFor(r.node,false);const expected=r.mode==='replace'?r.rendered:r.model?.html;if(now?.html!==expected)this.invalidate(r);}}this.active=true;const gen=++this.generation;this.stats.failed=0;this.stats.state='running';this.batchFailures=0;this.emit('Memindai seluruh halaman');
      await this.scan();if(gen!==this.generation)return{message:'Dibatalkan.'};this.pump();return{message:'Seluruh halaman diproses lewat batch paralel.'};
    }
    takeBatch(){
      const maxItems=24,maxChars=10000;
      const candidates=[];for(const r of this.records.values())if(r.state==='new'&&r.node.isConnected){const rect=(r.node.nodeType===3?r.node.parentElement||r.node.getRootNode().host:r.node).getBoundingClientRect(),height=r.node.ownerDocument.defaultView.innerHeight;candidates.push({r,rank:rect.bottom>=0&&rect.top<height?Math.max(0,rect.top):100000+Math.abs(rect.top)});}
      candidates.sort((a,b)=>a.rank-b.rank);const batch=[];let chars=0;
      for(const {r}of candidates){
        const model=modelFor(r.node);if(!model){r.state='skipped';this.stats.skipped++;continue;}
        if(batch.length&&(batch.length>=maxItems||chars+model.html.length>maxChars))break;
        this.sourceBudget+=model.length-r.sourceLength;r.sourceLength=model.length;if(this.sourceBudget>750000){r.state='skipped';this.stats.skipped++;continue;}
        r.state='pending';batch.push({record:r,model,revision:r.revision});chars+=model.html.length;if(model.html.length>12000)break;
      }
      return batch;
    }
    async translateLongText(model,gen){
      let offset=0,plain='',provider='';while(offset<model.plain.length){if(!this.active||gen!==this.generation)throw Error('Dibatalkan.');let end=Math.min(offset+1800,model.plain.length);if(end<model.plain.length){const space=model.plain.lastIndexOf(' ',end);if(space>offset+900)end=space;if(/[\uD800-\uDBFF]/.test(model.plain[end-1]))end--;}
        const source=model.plain.slice(offset,end),parts=/^(\s*)([\s\S]*?)(\s*)$/.exec(source);if(parts[2]){const row=(await this.translateBatch([escapeText(parts[2])],this.settings))[0];const chunk={plain:parts[2],entries:new Map()};plain+=parts[1]+parseResult(row.text,chunk).children.join('')+parts[3];provider=row.provider;}else plain+=source;offset=end;
      }return{text:escapeText(plain),provider};
    }
    failBatch(batch,error,gen){
      if(!this.active||gen!==this.generation)return;
      for(const item of batch){const r=item.record;if(r.revision!==item.revision||r.state!=='pending')continue;r.state='failed';this.stats.failed++;}
      this.batchFailures=(this.batchFailures||0)+1;this.emit(error.message);
      if(this.batchFailures>=3){this.active=false;this.generation++;this.disconnect();this.cancel();this.running=false;for(const r of this.records.values())if(r.state==='pending')r.state='new';this.stats.state='partial';this.emit('Provider gagal pada 3 batch. Klik terjemahkan untuk mencoba ulang.');}
    }
    async pump(){
      if(!this.active||this.running||this.timer||this.scanning)return;
      this.running=true;const gen=this.generation;
      const work=async()=>{
        while(this.active&&gen===this.generation&&!this.timer){
          this.flush();if(this.timer||!this.active||gen!==this.generation)return;
          const batch=this.takeBatch();if(!batch.length)return;
          this.stats.state='running';this.emit('Menerjemahkan seluruh halaman · batch paralel');
          try{
            const results=batch.length===1&&batch[0].record.node.nodeType===3&&batch[0].model.html.length>12000?[await this.translateLongText(batch[0].model,gen)]:await this.translateBatch(batch.map(x=>x.model.html),this.settings);
            this.flush();if(!this.active||gen!==this.generation)return;
            if(!Array.isArray(results)||results.length!==batch.length)throw Error('Jumlah hasil batch tidak cocok.');
            let invalid=0,rescan=false;
            for(let i=0;i<batch.length;i++){
              const {record:r,model,revision}=batch[i];
              if(revision!==r.revision||!r.node.isConnected||this.records.get(r.node)!==r)continue;
              if(!sameSource(r.node,model)){this.invalidate(r);continue;}
              try{this.commit(r,model,results[i].text,results[i].provider);this.stats.done++;}
              catch(e){if(r.node.nodeType===1&&model.entries.size){this.textFallback.add(r.node);this.records.delete(r.node);this.sourceBudget-=r.sourceLength;rescan=true;}else{r.state='failed';this.stats.failed++;invalid++;this.emit(e.message);}}
            }
            if(rescan)await this.scan();
            if(invalid)this.batchFailures=(this.batchFailures||0)+1;
          }catch(e){this.failBatch(batch,e,gen);}
          // Yield once per batch so DOM updates remain responsive; no per-block delay.
          await new Promise(resolve=>setTimeout(resolve,0));
        }
      };
      try{await Promise.all(Array.from({length:4},()=>work()));}
      finally{
        if(gen===this.generation){
          this.running=false;
          if(this.active){const remaining=[...this.records.values()].some(r=>r.state==='new');
            if(remaining&&!this.timer){queueMicrotask(()=>this.pump());return;}
            this.stats.state=this.stats.failed?'partial':remaining?'running':'done';
            this.emit(this.stats.failed?'Sebagian blok gagal; klik terjemahkan untuk mencoba ulang.':this.stats.limited?'Bagian yang ditemukan selesai; batas scan halaman tercapai.':remaining?'Menunggu teks stabil.':'Seluruh blok yang ditemukan selesai diterjemahkan.');
          }
        }
      }
    }
    compactAnchor(node){
      const el=node.nodeType===3?node.parentElement:node;if(!el)return null;
      if(node.nodeType===3||el.closest('button,a,label,select,option,summary,nav,header,footer,table,[role="button"],[role="navigation"],[role="menu"],[role="tab"],[role="toolbar"]'))return el;
      const view=el.ownerDocument.defaultView,style=view.getComputedStyle(el);
      if(!['block','flow-root','list-item'].includes(style.display))return el;
      for(let current=el,depth=0;current&&current!==el.ownerDocument.body&&depth<4;current=current.parentElement,depth++){
        const css=view.getComputedStyle(current),height=current.computedStyleMap?.().get('height');
        if(css.overflowX!=='visible'||css.overflowY!=='visible'||(css.webkitLineClamp&&css.webkitLineClamp!=='none')||css.maxHeight!=='none'||(height&&String(height)!=='auto'))return el;
      }
      return null;
    }
    addHint(r,anchor,text){
      let hint=this.hints.get(anchor);if(!hint){hint={original:anchor.getAttribute('title'),rows:new Map(),applied:null};this.hints.set(anchor,hint);}
      hint.rows.set(r,text);r.hintAnchor=anchor;hint.applied=[...hint.rows.values()].join('\n');anchor.setAttribute('title',hint.applied);
    }
    removeHint(r){
      const anchor=r.hintAnchor,hint=this.hints.get(anchor);if(!hint)return;hint.rows.delete(r);const owned=anchor.getAttribute('title')===hint.applied;
      if(!hint.rows.size){if(owned){if(hint.original===null)anchor.removeAttribute('title');else anchor.setAttribute('title',hint.original);}this.hints.delete(anchor);}
      else {hint.applied=[...hint.rows.values()].join('\n');if(owned)anchor.setAttribute('title',hint.applied);}r.hintAnchor=null;
    }
    appendBilingual(out,tree,model,doc){
      const shadow=out.attachShadow({mode:'open'}),style=doc.createElement('style');
      style.textContent=':host{min-width:0;max-width:100%;white-space:normal;overflow-wrap:anywhere}*{box-sizing:border-box}a{color:inherit;text-decoration:underline}';shadow.append(style,render(tree,model,doc,false));
    }
    highlightOutput(out,inline=false){
      const dark=this.settings.theme==='dark'||(this.settings.theme!=='light'&&out.ownerDocument.defaultView.matchMedia('(prefers-color-scheme: dark)').matches);
      const background=dark?'#243b57':'#e9eff8',ink=dark?'#edf1f7':'#14243b',edge=dark?'#91a8c7':'#8293aa';
      out.style.cssText='display:'+(inline?'inline':'block')+'!important;position:static!important;float:none!important;min-width:0!important;max-width:100%!important;height:auto!important;width:auto!important;letter-spacing:normal!important;text-transform:none!important;white-space:normal!important;overflow-wrap:anywhere!important;font:inherit!important;line-height:1.65;background:'+background+'!important;color:'+ink+'!important;border-inline-start:2px solid '+edge+'!important;border-radius:4px;padding:'+(inline?'2px 5px':'6px 10px')+';margin:'+(inline?'0 5px':'6px 0')+';box-decoration-break:clone;-webkit-box-decoration-break:clone;';
    }
    commit(r,model,text,provider){
      const tree=parseResult(text,model),cost=model.html.length+text.length;
      if(this.retained+cost>1500000)throw Error('Batas memori konten tercapai. Pulihkan halaman sebelum melanjutkan.');
      const doc=r.node.ownerDocument,anchor=this.settings.bilingual?this.compactAnchor(r.node):null,mode=this.settings.bilingual?(anchor?'hint':'bilingual'):'replace';
      this.withOwnChanges(()=>{
        if(mode==='hint'){this.addHint(r,anchor,render(tree,model,doc,false).textContent);return;}
        if(r.node.tagName==='OPTION'&&!r.node.hasAttribute('value')){r.optionValue=r.node.value;r.node.setAttribute('value',r.optionValue);}
        if(r.node.nodeType===3){
          if(mode==='bilingual'){const out=doc.createElement('span');out.dataset.llOutput='true';out.className='notranslate';out.lang=this.settings.target;out.dir='auto';this.highlightOutput(out,true);this.appendBilingual(out,tree,model,doc);r.node.after(out);r.output=out;}
          else r.node.data=tree.children.join('');
        }else if(mode==='bilingual'){
          const out=doc.createElement('span');out.dataset.llOutput='true';out.className='notranslate';out.lang=this.settings.target;out.dir='auto';out.title=`Alibasa · ${provider}`;this.highlightOutput(out);this.appendBilingual(out,tree,model,doc);r.node.append(out);r.output=out;
        }else r.node.replaceChildren(render(tree,model,doc,true));
        if(r.node.dataset)r.node.dataset.llDone='true';
      });
      r.state='applied';r.mode=mode;r.model=model;r.cost=cost;r.rendered=mode==='replace'?modelFor(r.node,false)?.html:null;r.appliedNodes=mode==='replace'?topology(r.node):null;this.retained+=cost;
    }
    async exportItems(){if(this.active)this.stop();await this.scan();const items=[];for(const r of this.records.values())if(r.state!=='applied'&&r.node.isConnected){const model=modelFor(r.node);if(model)items.push({record:r,model,revision:r.revision,text:model.html});}return items;}
    importItem(item,text,provider){this.flush();const r=item.record,now=modelFor(r.node,false);if(!r.node.isConnected||r.revision!==item.revision||!sameSource(r.node,item.model))throw Error('Halaman berubah sejak ekspor; ekspor ulang batch.');this.commit(r,item.model,text,provider);this.stats.done++;}
  }
  globalThis.LinguaLitePage={PageEngine,modelFor,parseResult,sameSource};
})();
