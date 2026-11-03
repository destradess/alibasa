chrome.runtime.sendMessage({type:'public-settings'}).then(r=>{if(r?.ok)document.documentElement.dataset.theme=r.data.theme||'system';}).catch(()=>{});
