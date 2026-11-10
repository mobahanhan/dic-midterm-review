(() => {
  'use strict';
  const article=document.getElementById('article');
  if(!article)return;
  const invisible=/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;
  const clean=s=>String(s).replace(invisible,'').replace(/[\u00A0\u2000-\u200A\u202F]/g,' ').replace(/∣/g,'|').replace(/ϕ/g,'φ');
  const tag=node=>(node.localName||'').toLowerCase();
  const children=node=>[...node.children];
  const functions=new Set(['ln','log','exp','min','max','sin','cos','tan']);
  const unit=/^(?:[fpnumkMμµ]?(?:V|A|F|W|J|H|S|m|s)|(?:[kMGT]?Hz)|Ω|kΩ|MΩ|K)$/;
  const unknown=new Set();
  const mathCache=new WeakMap();
  const atomic=s=>/^[\p{L}\p{N}._□]+(?:_\([\p{L}\p{N},]+\))?(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)?$/u.test(s)||/^\d+(?:\.\d+)? [\p{L}Ω]+[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]*$/u.test(s);
  const group=s=>atomic(s)||/^\([^()]*\)$/.test(s)?s:'('+s+')';
  const script=(s,power=false)=>{
    if(power&&/^[−\-+]?\d+$/.test(s))return [...s].map(c=>({'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','−':'⁻'}[c])).join('');
    return (power?'^':'_')+(/^[\p{L}\p{N}□]+$/u.test(s)?s:'('+s+')');
  };
  const token=(plain,kind='atom',extra={})=>({plain,kind,...extra});
  function join(nodes,context={}){
    const values=nodes.map(n=>readMath(n,context)).filter(t=>t.plain||t.kind==='apply');
    if(context.index)return token(values.map(v=>v.plain).join('').replace(/\s+/g,' ').trim(),'atom');
    let output='',previous=null,barOpen=false;
    for(let i=0;i<values.length;i++){
      const original=values[i];let current={...original};
      if(current.plain==='μ'&&values[i+1]?.normal&&unit.test('μ'+values[i+1].plain)){
        current={...current,plain:'μ'+values[++i].plain,normal:true};
      }
      if(current.kind==='apply')continue;
      if(current.kind==='space')continue;
      if(current.kind==='bar'){current.kind=barOpen?'close':'open';barOpen=!barOpen;}
      let separator='';
      if(previous){
        const a=previous.kind,b=current.kind;
        const differential=previous.plain==='d'&&context.differentials&&b==='atom';
        const changes=previous.plain==='Δ'||previous.plain==='∂';
        const normalWord=(previous.normal&&current.normal||previous.plain==='μ'&&current.normal&&unit.test('μ'+current.plain))&&a==='atom'&&b==='atom';
        const opening=b==='open'||b==='group';
        const functionArgument=a==='fn'||(opening&&current.plain.startsWith('(')&&['V_out','V_in','I','C','C_j','c_j','c_jsw','c_jswg','V','D','E','F','f','y'].includes(previous.plain));
        if(current.kind==='table')separator='\n';
        else if(a==='op'||b==='op')separator=' ';
        else if(a==='comma')separator=' ';
        else if(current.plain==='d'&&context.differentials)separator=' ';
        else if(differential||changes||normalWord)separator='';
        else if(functionArgument)separator=opening?'':' ';
        else if(a==='prefix')separator=' ';
        else if((a==='atom'||a==='close'||a==='group')&&(b==='atom'||b==='open'||b==='group'||b==='fn'||b==='prefix')){
          // A numeric value followed by an explicitly upright unit reads as a
          // quantity; all other adjacent factors get an unambiguous × sign.
          separator=previous.number&&current.normal?' ':' × ';
        }
      }
      output+=separator+current.plain;previous=current;
    }
    output=output.replace(/ +\n/g,'\n').trim();
    const significant=values.filter(v=>!['space','apply'].includes(v.kind));
    if(significant.length===1)return {...significant[0],plain:output};
    return token(output,functions.has(output)?'fn':'atom',{normal:significant.every(v=>v.normal)||unit.test(output)});
  }
  function readMath(node,context={}){
    if(!node)return token('');
    const name=tag(node),parts=children(node),value=clean(node.textContent||'');
    if(name==='annotation'||name==='annotation-xml')return token('');
    if(name==='semantics')return readMath(parts.find(n=>!tag(n).startsWith('annotation')),context);
    if(['math','mstyle','mpadded','menclose'].includes(name))return join(parts,context);
    if(name==='mrow'){
      if(parts.some(n=>tag(n)==='mtable'))return join(parts.filter(n=>!(tag(n)==='mo'&&clean(n.textContent)==='{')),context);
      const value=join(parts,context);
      if(parts.length>1&&['(','[','{'].includes(clean(parts[0].textContent))&&/^[)\]}]/.test(clean(parts.at(-1).textContent)))return {...value,kind:'group'};
      return value;
    }
    if(name==='mspace')return token(' ','space');
    if(['mi','mn','mo','mtext','ms'].includes(name)){
      if(!value.trim())return token(' ','space');
      if(value==='|'||value==='‖')return token(value,'bar');
      if(['(','[','{'].includes(value))return token(value,'open');
      if([')',']','}'].includes(value))return token(value,'close');
      if([',','，',';','; '].includes(value))return token(value,'comma');
      if(value==='.'||value==='。'||value===':')return token(value,'punct');
      if(['%','‰','°'].includes(value))return token(value,'postfix');
      if(/^[=+−\-<>≤≥≈≠∝→←↔⇒↑↓×·⋅÷/:]$/.test(value))return token(value==='⋅'?'·':value,'op');
      if(/^[∫∑Σ]$/.test(value))return token(value==='Σ'?'∑':value,'prefix');
      if(functions.has(value))return token(value,'fn');
      return token(value,'atom',{normal:node.getAttribute('mathvariant')==='normal'||name==='mtext',number:name==='mn'});
    }
    if(name==='mfrac'){
      const startsD=n=>['d','∂'].includes(clean((['mi','mo'].includes(tag(n))?n:n?.querySelector('mi,mo'))?.textContent||''));
      const differential=context.differentials||startsD(parts[1]);
      const numerator=readMath(parts[0],{...context,differentials:differential}).plain;
      const denominator=readMath(parts[1],{...context,differentials:differential}).plain;
      return token(group(numerator)+'/'+group(denominator));
    }
    if(name==='msqrt')return token('√('+join(parts,context).plain+')');
    if(name==='mroot')return token('root('+readMath(parts[1],context).plain+', '+readMath(parts[0],context).plain+')');
    if(['msub','msup','msubsup','munder','mover','munderover'].includes(name)){
      const base=readMath(parts[0],context),index=n=>readMath(n,{...context,index:true}).plain;
      if(name==='msup')return {...base,plain:(['close','bar','fn','prefix'].includes(base.kind)?base.plain:group(base.plain))+script(index(parts[1]),true),number:base.number&&/^[−\-+]?\d+$/.test(index(parts[1]))};
      if(name==='msub'||name==='munder')return {...base,plain:base.plain+script(index(parts[1])),number:false};
      if(name==='mover')return token(base.plain+' (superscript: '+index(parts[1])+'）');
      return {...base,plain:base.plain+script(index(parts[1]))+script(index(parts[2]),true),number:false};
    }
    if(name==='mtable'){
      const rows=parts.map(row=>children(row).map(cell=>join(children(cell),context).plain));
      return token(rows.map(row=>{
        const value=(row[0]||'').replace(/[,，]\s*$/,'');
        return row.length===2?'  '+value+' when '+row[1]:'  '+row.join('; ');
      }).join('\n'),'table');
    }
    if(name==='mtr'||name==='mtd')return join(parts,context);
    if(!name)return token(clean(node.textContent||''));
    unknown.add(name);return parts.length?join(parts,context):token(value);
  }
  function mathText(element){
    const math=tag(element)==='math'?element:element.querySelector('math');
    if(!math)return clean(element.dataset?.raw||element.textContent||'');
    if(mathCache.has(math))return mathCache.get(math);
    const tex=math.querySelector('annotation[encoding="application/x-tex"]')?.textContent||'';
    const result=clean(readMath(math,{differentials:/\\int(?:[^A-Za-z]|$)|\\mathrm\{d\}/.test(tex)}).plain);
    mathCache.set(math,result);return result;
  }
  const skip='button,script,style,noscript,.eyebrow,.article-copy-tools,.figure-tools,.book-facts,.copy-omit,.diagram-viewport::before';
  function serialize(node,options={}){
    if(node.nodeType===Node.TEXT_NODE)return clean(node.textContent).replace(/\s+/g,' ');
    if(node.nodeType===Node.DOCUMENT_FRAGMENT_NODE){
      const nodes=[...node.childNodes],cells=nodes.filter(n=>['td','th'].includes(tag(n)));
      return cells.length?nodes.map(n=>serialize(n,options)).join(' | '):nodes.map(n=>serialize(n,options)).join('');
    }
    if(node.nodeType!==Node.ELEMENT_NODE)return '';
    const name=tag(node);
    if(node.matches(skip.replace(',.diagram-viewport::before','')))return '';
    if(node.matches('.math-inline,.formula,.katex,.diagram-math')||name==='math'){
      const content=mathText(node);return node.classList.contains('formula')?'\n\n'+content+'\n\n':content;
    }
    if(name==='svg'){
      if(!options.diagram)return '';
      return [...node.querySelectorAll('text,foreignObject')].map(n=>tag(n)==='foreignobject'?mathText(n):clean(n.textContent)).join('\n');
    }
    if(name==='title'||name==='desc')return '';
    if(name==='br')return '\n';
    if(name==='pre')return '\n\n'+clean(node.textContent)+'\n\n';
    if(name==='table')return '\n\n'+[...node.querySelectorAll('tr')].map(row=>[...row.children].map(cell=>normalize(serializeChildren(cell,options)).replace(/\n+/g,' ')).join(' | ')).join('\n')+'\n\n';
    if(name==='tr')return '\n'+[...node.children].map(cell=>normalize(serializeChildren(cell,options)).replace(/\n+/g,' ')).join(' | ')+'\n';
    if(name==='li'){
      const parent=node.parentElement;
      const numbered=parent&&tag(parent)==='ol';
      const index=numbered?Math.max(0,[...parent.children].indexOf(node))+(Number(parent.getAttribute('start'))||1):0;
      return '\n'+(numbered?index+'. ':'• ')+serializeChildren(node,options).trim()+'\n';
    }
    const body=serializeChildren(node,options);
    if(['h1','h2','h3','h4','p','blockquote','figure','figcaption','section','ul','ol'].includes(name))return '\n\n'+body+'\n\n';
    if(name==='div')return '\n'+body+'\n';
    return body;
  }
  function serializeChildren(node,options){return [...node.childNodes].map(n=>serialize(n,options)).join('');}
  function normalize(value){return clean(value).replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
  function pageText(){
    const parts=[serialize(article.querySelector('h1')),serialize(article.querySelector('.article-body'))];
    for(const figure of article.querySelectorAll('.study-figure')){
      parts.push(serialize(figure.querySelector('figcaption')));
      const source=figure.querySelector('.figure-source');if(source)parts.push(serialize(source));
    }
    return normalize(parts.join('\n\n'));
  }
  let savedRange=null;
  function copyScope(range){
    const drawing=document.querySelector('#figure-dialog[open] svg');
    if(drawing&&range.intersectsNode(drawing))return drawing;
    if(range.intersectsNode(article))return article;
    const ancestor=range.commonAncestorContainer;
    const element=ancestor.nodeType===1?ancestor:ancestor.parentElement;
    return element?.closest('#navigation,.pager,.reading-meta')||null;
  }
  function getRange(){
    const selection=getSelection();
    if(!selection||selection.isCollapsed||!selection.rangeCount)return null;
    const range=selection.getRangeAt(0);
    return copyScope(range)?range.cloneRange():null;
  }
  function mathBoundary(node){
    const el=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
    return el?.closest('.math-inline,.formula,.diagram-math')||el?.closest('.katex');
  }
  function selectionText(inputRange){
    const range=(inputRange||getRange())?.cloneRange();if(!range||range.collapsed)return '';
    const drawing=document.querySelector('#figure-dialog[open] svg');
    const scope=copyScope(range);
    if(!scope||!range.intersectsNode(scope))return '';
    const bounds=document.createRange();bounds.selectNodeContents(scope);
    if(range.compareBoundaryPoints(Range.START_TO_START,bounds)<0)range.setStart(bounds.startContainer,bounds.startOffset);
    if(range.compareBoundaryPoints(Range.END_TO_END,bounds)>0)range.setEnd(bounds.endContainer,bounds.endOffset);
    const startMath=mathBoundary(range.startContainer),endMath=mathBoundary(range.endContainer);
    if(startMath&&scope.contains(startMath))range.setStartBefore(startMath);
    if(endMath&&scope.contains(endMath))range.setEndAfter(endMath);
    const startEl=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement;
    const diagram=scope===drawing||!!startEl?.closest('svg');
    return normalize(serialize(range.cloneContents(),{diagram}));
  }

  const toolbar=document.createElement('div');toolbar.className='article-copy-tools';
  toolbar.innerHTML='<div class="copy-buttons"><button type="button" id="copy-page" class="copy-button">Copy page</button><button type="button" id="copy-selection" class="copy-button" disabled>Copy selection</button></div><span class="copy-hint">Copy text with paragraphs, equations, and tables in readable plain text.</span>';
  article.querySelector('.article-heading').append(toolbar);
  const copyPageButton=toolbar.querySelector('#copy-page'),copySelectionButton=toolbar.querySelector('#copy-selection');
  const toast=document.createElement('div');toast.className='copy-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.hidden=true;document.body.append(toast);
  let toastTimer,legacyCopying=false;
  function notify(message){clearTimeout(toastTimer);toast.textContent=message;toast.hidden=false;toastTimer=setTimeout(()=>{toast.hidden=true;},2600);}
  function legacyCopy(value){
    const input=document.createElement('textarea');input.value=value;input.readOnly=true;
    input.style.cssText='position:fixed;top:0;left:-10000px;width:1px;height:1px;font-size:16px';
    input.setAttribute('aria-hidden','true');
    const focus=document.activeElement,selection=getSelection(),ranges=[];
    if(selection)for(let i=0;i<selection.rangeCount;i++)ranges.push(selection.getRangeAt(i).cloneRange());
    document.body.append(input);input.focus({preventScroll:true});input.select();input.setSelectionRange(0,value.length);
    let copied=false;
    try{legacyCopying=true;copied=document.execCommand('copy');}catch{}finally{
      legacyCopying=false;input.remove();focus?.focus?.({preventScroll:true});
      if(selection){selection.removeAllRanges();ranges.forEach(r=>selection.addRange(r));}
    }
    return copied;
  }
  const dialog=document.createElement('dialog');dialog.id='copy-dialog';dialog.className='copy-dialog';dialog.setAttribute('aria-labelledby','copy-dialog-title');
  dialog.innerHTML='<div class="copy-dialog-heading"><strong id="copy-dialog-title">Copyable text</strong><button type="button" id="copy-dialog-close">Close ×</button></div><p>Select all text, then use your browser or system copy command.</p><label class="visually-hidden" for="copy-preview">Text to copy</label><textarea id="copy-preview" readonly spellcheck="false"></textarea><div class="copy-dialog-actions"><button type="button" id="copy-select-all" class="copy-button">Select all text</button></div>';
  document.body.append(dialog);
  const preview=dialog.querySelector('textarea');let opener;
  dialog.querySelector('#copy-dialog-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('#copy-select-all').addEventListener('click',()=>{preview.focus();preview.select();preview.setSelectionRange(0,preview.value.length);});
  dialog.addEventListener('close',()=>{document.body.classList.remove('copy-modal-open');opener?.focus({preventScroll:true});});
  async function copy(value,button,message){
    if(!value){notify('Select some text first.');return;}
    let copied=false;
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);copied=true;}}catch{}
    if(!copied)copied=legacyCopy(value);
    if(copied){notify(message);button.dataset.copyLabel||=button.textContent;clearTimeout(button.copyResetTimer);button.textContent='Copied';button.copyResetTimer=setTimeout(()=>{button.textContent=button.dataset.copyLabel;},1600);}
    else{opener=button;preview.value=value;dialog.showModal();document.body.classList.add('copy-modal-open');notify('Select and copy the text below.');}
  }
  copyPageButton.addEventListener('click',()=>copy(pageText(),copyPageButton,'Page copied. Equations are in readable plain text.'));
  copySelectionButton.addEventListener('mousedown',event=>event.preventDefault());
  copySelectionButton.addEventListener('pointerdown',event=>{savedRange=getRange()||savedRange;event.preventDefault();});
  copySelectionButton.addEventListener('click',()=>copy(selectionText(getRange()||savedRange),copySelectionButton,'Selection copied.'));
  document.addEventListener('selectionchange',()=>{
    if(legacyCopying)return;
    const range=getRange();if(range)savedRange=range;
    copySelectionButton.disabled=!range;
  });
  document.querySelectorAll('#article .formula').forEach(formula=>{
    const button=document.createElement('button');button.type='button';button.className='formula-copy';button.textContent='Copy equation';button.setAttribute('aria-label','Copy this equation as readable text');
    button.addEventListener('click',()=>copy(mathText(formula),button,'Equation copied.'));formula.prepend(button);
  });
  document.addEventListener('copy',event=>{
    if(legacyCopying||!event.clipboardData||document.activeElement?.matches('input,textarea'))return;
    const value=selectionText();if(!value)return;
    event.clipboardData.clearData();event.clipboardData.setData('text/plain',value);event.preventDefault();
  });
  window.BookCopy=Object.freeze({mathText,pageText,selectionText,serialize,nodeText:n=>normalize(serialize(n)),unknownMathTags:unknown});
})();
