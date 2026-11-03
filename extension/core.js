export const PROVIDERS = {
 bing:{name:'Bing / Microsoft - Free',kind:'bing',endpoint:'https://edge.microsoft.com/translate/translatetext'},
 google:{name:'Google - Free',kind:'google',endpoint:'https://translate.googleapis.com/translate_a/single'},

};
export const DEFAULTS = {appLanguage:'en', theme:'system', provider:'bing', source:'auto', target:'id', bilingual:false, dynamic:true, fallback:true};
export function language(code, source=false) {
  if (typeof code !== 'string' || !/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{2,8}){0,2}$/.test(code) || (code === 'auto' && !source)) throw Error('Kode bahasa tidak valid. Gunakan id, en, ja, zh-CN, dan sebagainya.');
  return code;
}
export function profile(settings) {
  const base=PROVIDERS[settings.provider];
  if (!base) throw Error('Provider tidak dikenal.');
  return {...base};
}
export function endpointURL(endpoint) {
  const u=new URL(endpoint);
  if (u.username || u.password || (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost','127.0.0.1'].includes(u.hostname)))) throw Error('Endpoint harus HTTPS atau HTTP localhost.');
  return u;
}
export function splitText(text, max=1400) {
  const result=[]; let rest=text;
  while(rest.length>max) {
    let cut=rest.lastIndexOf(' ',max);
    if(cut<max/2) cut=max;
    // Never cut a surrogate pair (emoji/non-BMP scripts).
    if(/[\uD800-\uDBFF]/.test(rest[cut-1])) cut--;
    result.push(rest.slice(0,cut));rest=rest.slice(cut);
  }
  if(rest) result.push(rest);
  return result;
}
export class LRU {
  constructor(maxEntries=300,maxChars=350000){this.map=new Map();this.chars=0;this.maxEntries=maxEntries;this.maxChars=maxChars;}
  get(k){const v=this.map.get(k);if(v!==undefined){this.map.delete(k);this.map.set(k,v);}return v;}
  set(k,v){if(k.length+v.length>this.maxChars)return;if(this.map.has(k)){this.chars-=k.length+this.map.get(k).length;this.map.delete(k);}this.map.set(k,v);this.chars+=k.length+v.length;while(this.map.size>this.maxEntries||this.chars>this.maxChars){const first=this.map.keys().next().value;this.chars-=first.length+this.map.get(first).length;this.map.delete(first);}}
  clear(){this.map.clear();this.chars=0;}
}
export async function translateOne(text, settings, signal, request=fetch) {
  const p=profile(settings), from=language(settings.source,true), to=language(settings.target);
  const url=endpointURL(p.endpoint.replace('{model}',encodeURIComponent(p.model||'')));
  const headers={'Content-Type':'application/json'};let body,method='POST';
  if(p.kind==='google') {
    if(settings.format==='html'){
      url.search=new URLSearchParams({client:'gtx',sl:from,tl:to,dt:'t'}).toString();
      headers['Content-Type']='application/x-www-form-urlencoded;charset=UTF-8';body=new URLSearchParams({q:text}).toString();
    }else{method='GET';url.search=new URLSearchParams({client:'gtx',sl:from,tl:to,dt:'t',q:text}).toString();}
  } else if(p.kind==='bing') {
    const map={'zh-CN':'zh-Hans','zh-TW':'zh-Hant','zh-HK':'zh-Hant','pt-BR':'pt','pt':'pt-PT'};
    if(settings.format==='html')url.searchParams.set('textType','html');
    url.searchParams.set('to',map[to]||to);url.searchParams.set('isEnterpriseClient','false');if(from!=='auto')url.searchParams.set('from',map[from]||from);
    body=JSON.stringify([text]);
  }

  const response=await request(url.href,{method,headers:method==='GET'?undefined:headers,body,signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'});
  if(!response.ok) {const err=Error(`Provider ${settings.provider}: HTTP ${response.status}${response.status===429?' — batas permintaan/kuota. Coba lagi nanti.':''}`);err.status=response.status;throw err;}
  const data=await response.json();let out;
  if(p.kind==='google')out=data?.[0]?.map(x=>x[0]||'').join('');
  else if(p.kind==='bing')out=data?.[0]?.translations?.[0]?.text;
  if(typeof out!=='string'||!out.trim())throw Error('Provider tidak mengembalikan terjemahan. Periksa model, bahasa, dan kuota.');
  if(out.length>50000)throw Error('Respons provider terlalu panjang.');
  return out;
}

// A batch keeps each block separate: native array for Bing; numbered envelopes elsewhere.
export function unwrapBatch(output,count){
  const rows=new Array(count),seen=new Set();let offset=0;
  const pattern=/<b([1-9]\d*)\s*>([\s\S]*?)<\/b\1\s*>/gi;
  output=String(output).trim().replace(/^```(?:html|xml)?\s*/i,'').replace(/\s*```$/,'');
  let match;while((match=pattern.exec(output))){
    if(output.slice(offset,match.index).trim())throw Error('Batas batch berubah; hasil tidak diterapkan.');
    const index=Number(match[1])-1;if(index<0||index>=count||seen.has(index))throw Error('ID batch tidak cocok.');
    seen.add(index);rows[index]=match[2];offset=pattern.lastIndex;
  }
  if(output.slice(offset).trim()||seen.size!==count)throw Error('Bagian batch hilang; hasil tidak diterapkan.');
  return rows;
}
export async function translateBatch(texts,settings,signal,request=fetch){
  if(!Array.isArray(texts)||!texts.length||texts.length>24||texts.some(x=>typeof x!=='string'||!x.trim()||x.length>12000)||texts.reduce((n,x)=>n+x.length,0)>16000)throw Error('Batch tidak valid atau terlalu besar.');
  if(texts.length===1)return [await translateOne(texts[0],{...settings,format:'html'},signal,request)];
  const p=profile(settings);
  if(p.kind==='bing'){
    const from=language(settings.source,true),to=language(settings.target),map={'zh-CN':'zh-Hans','zh-TW':'zh-Hant','zh-HK':'zh-Hant','pt-br':'pt','pt':'pt-PT'},url=endpointURL(p.endpoint);
    url.searchParams.set('textType','html');url.searchParams.set('to',map[to]||to);url.searchParams.set('isEnterpriseClient','false');if(from!=='auto')url.searchParams.set('from',map[from]||from);
    const r=await request(url.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(texts),signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error'});
    if(!r.ok){const err=Error('Provider bing: HTTP '+r.status);err.status=r.status;throw err;}
    const data=await r.json();if(!Array.isArray(data)||data.length!==texts.length)throw Error('Jumlah hasil batch Bing tidak cocok.');
    const out=data.map(x=>x?.translations?.[0]?.text);if(out.some(x=>typeof x!=='string'||!x.trim()||x.length>50000))throw Error('Hasil batch Bing tidak valid.');return out;
  }
  const joined=texts.map((text,i)=>'<b'+(i+1)+'>'+text+'</b'+(i+1)+'>').join('\n');
  return unwrapBatch(await translateOne(joined,{...settings,format:'html'},signal,request),texts.length);
}
