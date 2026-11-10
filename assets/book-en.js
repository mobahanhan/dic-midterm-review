(() => {
  'use strict';
  const book = window.BOOK_DATA;
  const math = window.BookMath;
  if (!book) return;
  const root = document.documentElement;
  const base = root.dataset.base || '';
  const page = book.pages.find(p => p.id === root.dataset.page) || book.pages[0];
  const nav = document.getElementById('navigation');
  const input = document.getElementById('book-search');
  const clearButton = document.getElementById('clear-search');
  const status = document.getElementById('live-status');
  const tabs = [...document.querySelectorAll('[data-tab]')];
  let activeTab = 'contents';
  let queries = {terms:'',figures:'',search:''};
  let timer;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escapeRE = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const fold = s => String(s).normalize('NFKC').toLowerCase();
  function readStore(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
  function writeStore(key, value) { try { localStorage.setItem(key, value); } catch {} }
  let size = Math.max(15,Math.min(24,Number(new URLSearchParams(location.search).get('size') || readStore('dic-size','18')) || 18));
  let theme = new URLSearchParams(location.search).get('theme') || readStore('dic-theme','light');
  if (!['light','dark'].includes(theme)) theme='light';

  function linkTo(href, hash='') {
    const url = new URL(base+href,location.href);
    if (theme !== 'light') url.searchParams.set('theme',theme); else url.searchParams.delete('theme');
    if (size !== 18) url.searchParams.set('size',String(size)); else url.searchParams.delete('size');
    if (hash) url.hash=hash;
    return url.href;
  }
  function updateExistingLinks() {
    document.querySelectorAll('[data-book-link],.term-ref,.term-item,.search-item').forEach(a => {
      const url=new URL(a.getAttribute('href'),location.href);
      if (theme !== 'light') url.searchParams.set('theme',theme); else url.searchParams.delete('theme');
      if (size !== 18) url.searchParams.set('size',String(size)); else url.searchParams.delete('size');
      a.href=url.href;
    });
  }
  function renderContents() {
    let html=`<a class="navigation-home ${page.seq===0?'active':''}" data-book-link href="${linkTo(book.homeHref||'index.html')}" ${page.seq===0?'aria-current="page"':''}>${book.homeLabel||'Start here'}</a>`;
    let open=[];
    try { open=JSON.parse(readStore('dic-nav-open','[]')); } catch {}
    for (const group of book.groups) {
      const children=book.pages.filter(p=>p.group===group.id);
      if (!children.length) continue;
      const isOpen=page.group===group.id || open.includes(group.id);
      html+=`<details class="nav-group" data-group="${group.id}" ${isOpen?'open':''}><summary>${group.titleHtml||escape(group.title)}</summary>`;
      for (const child of children) html+=`<a class="nav-page ${child.id===page.id?'active':''}" data-book-link href="${linkTo(child.href)}" ${child.id===page.id?'aria-current="page"':''}>${child.titleHtml||escape(child.title)}</a>`;
      html+='</details>';
    }
    nav.innerHTML=html;
    nav.querySelectorAll('details').forEach(details=>details.addEventListener('toggle',()=>writeStore('dic-nav-open',JSON.stringify([...nav.querySelectorAll('details[open]')].map(d=>d.dataset.group)))));
    const selected=nav.querySelector('[aria-current=page]');
    if (selected && page.seq) requestAnimationFrame(()=>{const r=selected.getBoundingClientRect(),n=nav.getBoundingClientRect();nav.scrollTop+=r.top-n.top-n.height*.32;});
  }
  const alphabetical=[...book.terms].sort((a,b)=>a.name.localeCompare(b.name,'en'));
  function renderTerms() {
    const q=fold(queries.terms.trim());
    const words=q.split(/\s+/).filter(Boolean);
    const matches=alphabetical.filter(t=>words.every(w=>fold(t.name+' '+t.preview).includes(w)));
    nav.innerHTML=`<p class="nav-caption">${q?`${matches.length} matching topics`:`${book.terms.length} topics, sorted by name`}<br>Open a topic to see its explanation in a practice question.</p><div class="term-list">`+
      matches.map(t=>`<a class="term-item" href="${linkTo(t.href,t.id)}" title="${escape(t.preview)}"><strong>${t.nameHtml||escape(t.name)}</strong><small>${t.sectionHtml||escape(t.section)}</small></a>`).join('')+'</div>';
    if (!matches.length) nav.innerHTML+='<p class="empty-result">No matching topics. Try a different term or use Search.</p>';
    status.textContent=`${matches.length} matching topics`;
  }
  function renderFigures(){
    const words=fold(queries.figures.trim()).split(/\s+/).filter(Boolean);
    const matches=(book.figures||[]).filter(f=>words.every(w=>fold(f.title+' '+f.section+' '+f.intro).includes(w)));
    nav.innerHTML=`<p class="nav-caption">${matches.length} figures<br>Select a figure to find it in its question.</p>`+matches.map(f=>`<a class="figure-item term-item" href="${linkTo(f.href,f.id)}"><strong><span class="figure-number">${f.number}</span>${f.titleHtml||escape(f.title)}</strong><small>${f.sectionHtml||escape(f.section)}</small></a>`).join('');
    if(!matches.length)nav.innerHTML+='<p class="empty-result">No matching figures. Try a shorter keyword.</p>';
    status.textContent=`${matches.length} figures`;
  }
  function highlight(text, words) {
    if(!words.length) return escape(text);
    const regex=new RegExp(words.map(escapeRE).join('|'),'gi');
    let result='',at=0;
    for(const match of text.matchAll(regex)) {
      result+=escape(text.slice(at,match.index))+'<mark>'+escape(match[0])+'</mark>';
      at=match.index+match[0].length;
    }
    return result+escape(text.slice(at));
  }
  function renderSearch() {
    const q=fold(queries.search.trim());
    if (!q) {
      nav.innerHTML='<p class="empty-result">Search the English practice questions.<br><br>Separate multiple keywords with spaces.</p>';
      return;
    }
    const words=q.split(/\s+/).filter(Boolean);
    const results=book.pages.map(p=>{
      const text=fold(p.title+' '+p.text);
      if(!words.every(w=>text.includes(w))) return null;
      const title=fold(p.title);
      const score=words.reduce((sum,w)=>sum+(title.includes(w)?100:0)+(fold(p.text).indexOf(w)<300?5:0),0);
      return {page:p,score};
    }).filter(Boolean).sort((a,b)=>b.score-a.score || a.page.seq-b.page.seq);
    nav.innerHTML=`<p class="nav-caption">${results.length} matching pages</p>`+results.map(({page:p})=>{
      const at=Math.max(0,...words.map(w=>fold(p.text).indexOf(w)).filter(n=>n>=0).map(n=>n-35));
      const snippet=(at>0?'…':'')+p.text.slice(at,at+145)+(p.text.length>at+145?'…':'');
      return `<a class="search-item" href="${linkTo(p.href)}"><small>Page ${p.seq+1}</small><strong>${math&&!book.homeHref?math.formatText(p.title,{heading:true,highlight:words}):highlight(p.title,words)}</strong><p>${math&&!book.homeHref?math.formatText(snippet,{highlight:words}):highlight(snippet,words)}</p></a>`;
    }).join('');
    if (!results.length) nav.innerHTML+='<p class="empty-result">No matching pages. Try a shorter keyword or use the glossary.</p>';
    status.textContent=`${results.length} matching pages`;
  }
  function renderNavigation() {
    clearButton.hidden=!input.value;
    nav.setAttribute('aria-labelledby','tab-'+activeTab);
    tabs.forEach(tab=>{tab.setAttribute('aria-selected',String(tab.dataset.tab===activeTab));tab.tabIndex=tab.dataset.tab===activeTab?0:-1;});
    if(activeTab==='contents') renderContents();
    else if(activeTab==='terms') renderTerms();
    else if(activeTab==='figures') renderFigures();
    else renderSearch();
  }
  function setTab(name) {
    activeTab=name;
    input.value=queries[name]||'';
    input.placeholder=name==='terms'?'Find a topic…':name==='figures'?'Find a figure…':'Search questions or terms…';
    renderNavigation();
  }
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>setTab(tab.dataset.tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const index=(tabs.indexOf(tab)+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      setTab(tabs[index].dataset.tab);tabs[index].focus();
    });
  });
  input.addEventListener('input',()=>{
    if(activeTab==='contents') activeTab='search';
    queries[activeTab]=input.value;
    clearTimeout(timer);timer=setTimeout(renderNavigation,90);
  });
  input.addEventListener('keydown',event=>{
    if(event.key==='Enter') {clearTimeout(timer);renderNavigation();nav.querySelector('.search-item,.term-item')?.click();}
    if(event.key==='Escape') {input.value='';queries[activeTab]='';renderNavigation();}
  });
  clearButton.addEventListener('click',()=>{input.value='';queries[activeTab]='';renderNavigation();input.focus();});

  function linkTerms() {
    const article=document.getElementById('article');
    const names=book.terms.map(t=>t.name).filter(name=>name.length>1).sort((a,b)=>b.length-a.length);
    const regex=new RegExp(names.map(escapeRE).join('|'),'g');
    const byName=new Map(book.terms.map(t=>[t.name,t]));
    const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT,{acceptNode(node){
      if(!node.textContent.trim() || node.parentElement.closest('a,dfn,code,pre,.formula,.math-inline,.katex,math,svg,h1,h2,h3,h4,.eyebrow,.book-facts')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes) {
      const content=node.textContent;
      regex.lastIndex=0;
      if(!regex.test(content)) continue;
      regex.lastIndex=0;
      const fragment=document.createDocumentFragment();
      let at=0;
      for(const match of content.matchAll(regex)) {
        const t=byName.get(match[0]);
        fragment.append(document.createTextNode(content.slice(at,match.index)));
        const a=document.createElement('a');a.className='term-ref';a.href=linkTo(t.href,t.id);a.textContent=match[0];a.title='See the explanation: '+t.section;
        fragment.append(a);at=match.index+match[0].length;
      }
      fragment.append(document.createTextNode(content.slice(at)));node.replaceWith(fragment);
    }
  }
  function applyPreferences() {
    root.dataset.theme=theme;
    root.style.setProperty('--reading-size',size+'px');
    const themeButton=document.getElementById('theme-toggle');
    themeButton.textContent=theme==='dark'?'Light':'Dark';
    themeButton.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode');
    document.getElementById('font-smaller').disabled=size<=15;
    document.getElementById('font-larger').disabled=size>=24;
    writeStore('dic-theme',theme);writeStore('dic-size',String(size));
    updateExistingLinks();
    renderNavigation();
  }
  document.getElementById('font-smaller').addEventListener('click',()=>{size=Math.max(15,size-1);applyPreferences();status.textContent='Text size decreased';});
  document.getElementById('font-larger').addEventListener('click',()=>{size=Math.min(24,size+1);applyPreferences();status.textContent='Text size increased';});
  document.getElementById('theme-toggle').addEventListener('click',()=>{theme=theme==='light'?'dark':'light';applyPreferences();});
  const sidebar=document.getElementById('sidebar');
  const shade=document.getElementById('sidebar-shade');
  const menu=document.getElementById('menu-toggle');
  function setMenu(open) {
    sidebar.classList.toggle('open',open);shade.classList.toggle('visible',open);menu.setAttribute('aria-expanded',String(open));
    document.getElementById('reader').inert=open;
    document.body.style.overflow=open?'hidden':'';
  }
  menu.addEventListener('click',()=>setMenu(!sidebar.classList.contains('open')));
  shade.addEventListener('click',()=>setMenu(false));
  document.addEventListener('keydown',event=>{
    if(document.querySelector('dialog[open]'))return;
    if(event.key==='Escape') setMenu(false);
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k') {event.preventDefault();if(innerWidth<=800)setMenu(true);input.focus();return;}
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey) return;
    if(document.activeElement?.closest('input,textarea,select,button,summary,a,[contenteditable=true]')) return;
    if(window.getSelection()?.toString()) return;
    const target=event.key==='ArrowLeft'?book.pages[page.seq-1]:event.key==='ArrowRight'?book.pages[page.seq+1]:null;
    if(target) {event.preventDefault();location.href=linkTo(target.href);}
  });
  function updateProgress() {
    const max=document.documentElement.scrollHeight-innerHeight;
    document.getElementById('reading-progress').style.width=(max>0?Math.min(100,scrollY/max*100):100)+'%';
  }
  function updateFormulaHints() {
    document.querySelectorAll('.formula').forEach(el=>el.dataset.overflow=String(el.scrollWidth>el.clientWidth+3));
  }
  const figureDialog=document.getElementById('figure-dialog');
  let figureOpener;
  document.querySelectorAll('[data-figure-open]').forEach(button=>button.addEventListener('click',()=>{
    const figure=document.getElementById(button.dataset.figureOpen);
    const drawing=figure.querySelector('svg,img').cloneNode(true);
    // The clone gets unique accessibility IDs while the original remains intact.
    const title=drawing.querySelector('title'),desc=drawing.querySelector('desc');
    if(title&&desc){title.id+='-zoom';desc.id+='-zoom';drawing.setAttribute('aria-labelledby',title.id+' '+desc.id);}
    document.getElementById('figure-dialog-title').textContent=figure.querySelector('figcaption strong').textContent;
    document.getElementById('figure-dialog-content').replaceChildren(drawing);
    figureOpener=button;figureDialog.showModal();document.body.classList.add('figure-modal-open');
  }));
  document.getElementById('figure-dialog-close').addEventListener('click',()=>figureDialog.close());
  figureDialog.addEventListener('click',event=>{if(event.target===figureDialog){const r=figureDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)figureDialog.close();}});
  figureDialog.addEventListener('close',()=>{document.body.classList.remove('figure-modal-open');figureOpener?.focus();});
  addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',()=>{if(innerWidth>800)setMenu(false);updateProgress();updateFormulaHints();});
  applyPreferences();updateProgress();
  document.fonts.ready.then(updateFormulaHints);
  if(location.hash) {
    document.fonts.ready.then(()=>{const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target){for(let parent=target.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}target.scrollIntoView({block:'start'});}});
  }
})();
