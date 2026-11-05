(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./package/dist/katex.js'));
  else root.BookMath=factory(root.katex);
})(typeof globalThis!=='undefined'?globalThis:this,function(katex){
  'use strict';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos|#39|#x[\da-f]+|#\d+);/gi,m=>{
    const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"};
    if(named[m])return named[m];
    return String.fromCodePoint(parseInt(m.slice(m[2].toLowerCase()==='x'?3:2,-1),m[2].toLowerCase()==='x'?16:10));
  });
  const atoms=new Map();
  const put=(name,tex,more={})=>atoms.set(name,{kind:'atom',raw:name,tex,...more});
  const roman=s=>'\\mathrm{'+s+'}';
  const sub=(base,label)=>base+'_{'+label+'}';
  for(const c of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')put(c,c);
  const protectedWords=new Set(['Table','Table1','Table3.3','Value','given','sum','rounded','capacitor','expression','device','Region','Type','Concept','Computing','ON','OFF','aggressor','Cadence','capacitance','Dennard','die','Elmore','fan-in','fan-out','HSPICE','in','input','latch-up','margin','noise','out','overlap','process','regenerator','repeater','RISC-V','slack','slope','up','Verilog','victim','wafer','x86','JavaScript','index.html','pages','assets','Markdown','LaTeX','MATHPLACEHOLDER','.dc','.tran','.measure']);
  const acronyms=['AC','AND','CMOS','DC','DIBL','DIC','EDP','FET','FF','FS','GC','GIDL','GND','HL','IC','KCL','LH','MCF','MOS','MOSFET','NAND','NM','NMOS','OR','PDP','PMOS','PN','PVT','SF','SS','VTC'];
  for(const name of acronyms)put(name,roman(name));
  put('NMH','\\mathrm{NM}_{\\mathrm{H}}');put('NML','\\mathrm{NM}_{\\mathrm{L}}');
  put('nMOS',roman('nMOS'));put('pMOS',roman('pMOS'));
  for(const name of ['new','old','ref','sw','dec'])put(name,roman(name));
  put('Si',roman('Si'));put('SiO',roman('SiO'));put('SiO₂','\\mathrm{SiO}_{2}');put('M1',roman('M1'));put('M2',roman('M2'));
  for(const name of ['DD','GS','DS','SG','SD','SB','BS','OH','OL','IH','IL','DSAT','T','Tn','Tp','T0','Don','DSATn','DSATp','DS2'])put('V'+name,sub('V',roman(name)));
  for(const name of ['A','B','AB','D','G','S','R','X','M','L','1','2'])put('V'+name,sub('V',name==='1'||name==='2'?name:roman(name)));
  for(const name of ['in','out'])put('V'+name,sub('V',roman(name)));
  for(const name of ['i','o','s','n','p','a','v'])put('V'+name,sub('V',name));
  put('VT,eff',sub('V',roman('T,eff')));put('VGS' ,sub('V',roman('GS')));
  put('VM+','V_{\\mathrm{M}+}');put('VM−','V_{\\mathrm{M}-}');
  for(const name of ['ov','ds'])put('v'+name,sub('v',roman(name)));
  for(const name of ['1','2','m'])put('v'+name,sub('v',name));
  put('vov1',sub('v',roman('ov')+'1'));put('vov2',sub('v',roman('ov')+'2'));
  for(const name of ['int','ext','ox','gnd','wire','Load','wafer','eq','pp'])put('C'+name,sub('C',roman(name)));
  for(const name of ['G','GB','GC','GCB','GCS','GCD','GS','GD','GSO','GDO','SB','DB'])put('C'+name,sub('C',roman(name)));
  for(const name of ['c','d','a','v','g','o','j'])put('C'+name,sub('C',name));
  put('CL','C_L');
  put('Cj0',sub('C','j0'));
  for(const name of ['D','S'])put('A'+name,sub('A',roman(name)));
  put('Aj',sub('A','j'));put('Adie',sub('A',roman('die')));put('Achain',sub('A',roman('chain')));put('A0',sub('A','0'));
  for(const name of ['D','S'])put('P'+name,sub('P',roman(name)));
  for(const name of ['sw','sc','leak','avg','peak','total'])put('P'+name,sub('P',roman(name)));
  for(const name of ['C','leak','supply'])put('E'+name,sub('E',roman(name)));
  put('Esc,event',sub('E',roman('sc,event')));
  for(const name of ['ext,i','g,i','g,1','g,ref','int,ref','down,k','eff,A']){
    const [prefix,index]=name.split(',');put('C'+name,sub('C',(prefix==='g'?'g':roman(prefix))+','+(index==='ref'?roman(index):index)));
  }
  put('Cg1',sub('C','g1'));put('CGDn',sub('C',roman('GD')+'n'));put('CGDp',sub('C',roman('GD')+'p'));
  put('CDBn',sub('C',roman('DB')+'n'));put('CDBp',sub('C',roman('DB')+'p'));
  for(const name of ['j','jsw','jswg'])put('c'+name,sub('c',name==='j'?'j':'j'+roman(name.slice(1))));
  for(const name of ['contact','wire','eq','ref'])put('R'+name,sub('R',roman(name)));
  for(const name of ['a','d','n','p','s','v','L'])put('R'+name,sub('R',name));
  for(const name of ['n0','p0','ij','k'])put('R'+name,sub('R',name));
  put('R□','R_{\\square}');
  for(const name of ['i','o','L','V'])put('r'+name,sub('r',name));
  for(const name of ['n','p'])put('K'+name,sub('K',name));put('Keq',sub('K',roman('eq')));
  for(const name of ['s','sat','leak','peak'])put('I'+name,sub('I',roman(name)));
  put('ID',sub('I',roman('D')));put('IDn',sub('I',roman('D')+'n'));put('IDp',sub('I',roman('D')+'p'));put('I0','I_0');
  for(const name of ['w','s','d','n','p'])put('L'+name,sub('L',name));
  for(const name of ['eff','ind','crit'])put('L'+name,sub('L',roman(name)));
  for(const name of ['w','n','p'])put('W'+name,sub('W',name));put('Hw','H_w');
  for(const name of ['A','D'])put('N'+name,sub('N',roman(name)));
  for(const name of ['body','die','seg'])put('N'+name,sub('N',roman(name)));
  put('ni','n_i');put('nsub',sub('n',roman('sub')));
  for(const name of ['p','pd','cd','r','f','s','sc','ox','buf','gate','wire'])put('t'+name,sub('t',roman(name)));
  put('tp0',sub('t',roman('p')+'0'));put('tpHL',sub('t',roman('pHL')));put('tpLH',sub('t',roman('pLH')));
  put('tp,i',sub('t',roman('p')+',i'));
  for(const name of ['clk','size'])put('f'+name,sub('f',roman(name)));
  put('f01','f_{0\\to1}');put('mc','m_c');put('mopt',sub('m',roman('opt')));
  put('hi','h_i');put('hN','h_N');put('di','d_i');put('d(i−1)','d_{i-1}');put('d(i-1)','d_{i-1}');
  put('p0','p_0');put('p1','p_1');put('p0p1','p_0 p_1');
  put('srep',sub('s',roman('rep')));put('alen',sub('a',roman('len')));put('an','a_n');put('ap','a_p');
  put('Dmax',sub('D',roman('max')));put('Dchain,min',sub('D',roman('chain,min')));put('Dwafer',sub('D',roman('wafer')));
  put('gm','g_m');put('gds',sub('g',roman('ds')));put('kB',sub('k',roman('B')));put('Tabs',sub('T',roman('abs')));put('UT','U_T');
  put('Ssize',sub('S',roman('size')));put('Sgeo',sub('S',roman('geo')));put('Ssub',sub('S',roman('sub')));put('Uvolt',sub('U',roman('volt')));put('xd','x_d');
  for(const [raw,tex] of Object.entries({'α':'\\alpha','β':'\\beta','γ':'\\gamma','δ':'\\delta','Δ':'\\Delta','ε':'\\varepsilon','η':'\\eta','κ':'\\kappa','λ':'\\lambda','μ':'\\mu','π':'\\pi','ρ':'\\rho','Σ':'\\sum','τ':'\\tau','φ':'\\phi','Ω':'\\Omega'}))put(raw,tex);
  for(const [raw,base,index] of [
    ['γB','\\gamma','B'],['γC','\\gamma','C'],['λCL','\\lambda','CL'],['λlayout','\\lambda','layout'],['μmag','\\mu','mag'],['εdi','\\varepsilon','di'],['εox','\\varepsilon','ox'],['εSi','\\varepsilon','Si'],['ηD','\\eta','D'],['ηs','\\eta','s']])put(raw,sub(base,roman(index)));
  put('μn','\\mu_n');put('μp','\\mu_p');put('φ0','\\phi_0');put('φF',sub('\\phi',roman('F')));put('βp','\\beta_p');
  for(const name of ['a','v','E'])put('τ'+name,sub('\\tau',name==='E'?roman(name):name));
  put('τE,i',sub('\\tau',roman('E')+',i'));put('τE,b',sub('\\tau',roman('E')+',b'));
  for(const name of ['VA','VB','Va','Vv','t'])put('Δ'+name,'\\Delta '+(atoms.get(name)?.tex||name));
  put('n+','n^{+}');put('p+','p^{+}');put('log₁₀','\\log_{10}',{fn:true});
  for(const name of ['min','max','ln','log','exp'])put(name,'\\'+name,{fn:true});
  for(const name of ['Q','I','VGS','Vin','Vout','X','Y','x','t'])put('d'+name,'\\mathrm{d}'+(atoms.get(name)?.tex||name));
  const units=['mA','μA','μW','fF','pF','fJ','mV','MHz','Hz','nm','cm','μm','ns','ps','fs','ms'];
  const unitTex=unit=>unit.replace(/μ/g,'\\mu ');
  for(const name of units)put(name,roman(unitTex(name)),{unit:true});
  put('Ω','\\Omega',{unit:true});put('kΩ','\\mathrm{k}\\Omega',{unit:true});put('MΩ','\\mathrm{M}\\Omega',{unit:true});
  const unitSingles=new Set(['V','A','C','F','J','W','H','K','S','m','s']);
  const composites={
    CoxWL:['Cox','W','L'],CoW:['Co','W'],CV:['C','V'],CVDD:['C','VDD'],
    kBTabs:['kB','Tabs'],μCox:['μ','Cox'],cLw:['c','Lw'],rLw:['r','Lw'],rc:['r','c'],rcLcrit:['r','c','Lcrit'],
    WwHw:['Ww','Hw'],WwLw:['Ww','Lw'],ρLw:['ρ','Lw'],εdiA:['εdi','A'],εSiNbody:['εSi','Nbody'],
    λCLVDD:['λCL','VDD'],Ntp:['N','tp'],Ntp0:['N','tp0'],nsubUT:['nsub','UT'],αfclk:['α','fclk'],
    αCLVDD:['α','CL','VDD'],VDDIleak:['VDD','Ileak'],R1C3:['R1','C3'],R2C2:['R2','C2'],RijCj:['Rij','Cj'],
    RaCa:['Ra','Ca'],RvCv:['Rv','Cv'],RnCL:['Rn','CL'],RpCL:['Rp','CL'],RwireCLoad:['Rwire','CLoad'],
    RwireCwire:['Rwire','Cwire'],srepCd:['srep','Cd'],mcCc:['mc','Cc'],mtbuf:['m','tbuf'],Kvov:['K','vov'],
    lnF:['ln','F'],lnfsize:['ln','fsize'],ln10:['ln','10'],ln4:['ln','4'],Σj:['Σ','j']
  };
  function basicAtom(raw){
    if(atoms.has(raw))return {...atoms.get(raw)};
    const indexed=raw.match(/^([RChdpv])[0-9]+$/);
    if(indexed)return {kind:'atom',raw,tex:indexed[1]+'_{'+raw.slice(1)+'}'};
    if(/^\d+(?:\.\d+)?$/.test(raw))return {kind:'number',raw,tex:raw};
    return null;
  }
  for(const [name,parts] of Object.entries(composites)){
    const tex=parts.map(part=>basicAtom(part)?.tex||part).join(' ');
    put(name,tex);
  }
  const special=[...atoms.keys()].filter(s=>s.includes(',')||/[+−(]/.test(s)||/[₀-₉]/.test(s)||s==='R□').sort((a,b)=>b.length-a.length);
  const protectedNames=[...protectedWords].filter(s=>/[-.]/.test(s)).sort((a,b)=>b.length-a.length);
  const supers={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+','ⁿ':'n','ˣ':'x','ʸ':'y'};
  const opMap={'=':'=','<':'<','>':'>','≤':'\\le','≥':'\\ge','≈':'\\approx','∝':'\\propto','→':'\\to','∞':'\\infty','∂':'\\partial','∫':'\\int','√':'√','×':'\\times','·':'\\cdot','÷':'/','−':'-','–':'-','+':'+','-':'-','*':'\\cdot','/':'/','^':'^','(':'(',')':')','[':'[',']':']','{':'{','}':'}','|':'|',',':',','%':'%','′':"'",'□':'\\square'};
  const rel=new Set(['=','<','>','\\le','\\ge','\\approx','\\propto','\\to']);
  const isWord=c=>!!c&&/[A-Za-zα-ωΑ-Ω]/.test(c);
  const compoundParts=[...atoms.keys()].filter(name=>!name.includes(',')&&!name.includes('+')).sort((a,b)=>b.length-a.length);
  const inferred=new Map();
  function compound(raw){
    if(protectedWords.has(raw)||/^MATHPLACEHOLDER\d+END$/.test(raw))return null;
    const parts=[];let i=0;
    while(i<raw.length){
      const numeric=raw.slice(i).match(/^\d+/);
      if(numeric){parts.push(numeric[0]);i+=numeric[0].length;continue;}
      const name=compoundParts.find(name=>raw.startsWith(name,i));
      if(!name)return null;
      parts.push(atoms.get(name).tex);i+=name.length;
    }
    const tex=parts.join(' ');inferred.set(raw,tex);return {kind:'atom',raw,tex};
  }
  function lex(text){
    const tokens=[];let i=0;
    while(i<text.length){
      const start=i;const c=text[i];
      const protectedName=protectedNames.find(name=>text.startsWith(name,i));
      if(protectedName){i+=protectedName.length;tokens.push({kind:'text',raw:protectedName,start,end:i});continue;}
      const specialName=special.find(name=>text.startsWith(name,i)&&(name==='R□'||!/[A-Za-z0-9]/.test(text[i+name.length]||'')));
      if(specialName){i+=specialName.length;tokens.push({...atoms.get(specialName),start,end:i});continue;}
      if(/[0-9]/.test(c)){
        const raw=text.slice(i).match(/^\d+(?:\.\d+)?/)[0];i+=raw.length;tokens.push({kind:'number',raw,tex:raw,start,end:i});continue;
      }
      if(supers[c]){
        let raw='';while(supers[text[i]])raw+=text[i++];
        tokens.push({kind:'sup',raw,tex:[...raw].map(x=>supers[x]).join(''),start,end:i});continue;
      }
      if(c==='∂'){
        const match=text.slice(i+1).match(/^[A-Za-z][A-Za-z0-9]*/);
        if(match){const part=basicAtom(match[0])||compound(match[0]);if(part){i+=1+match[0].length;tokens.push({kind:'atom',raw:text.slice(start,i),tex:'\\partial '+part.tex,start,end:i});continue;}}
      }
      if(isWord(c)||c==='Ω'){
        const raw=text.slice(i).match(/^[A-Za-zα-ωΑ-Ω][A-Za-z0-9α-ωΑ-Ω]*/)[0];i+=raw.length;
        let atom=basicAtom(raw)||compound(raw);
        if(raw==='log'&&text.slice(i,i+2)==='₁₀'){i+=2;atom={...atoms.get('log₁₀')};}
        if(atom&&raw.length===1&&/^[kMmμnpfa]$/.test(raw)&&/^是10/.test(text.slice(i)))atom={...atom,tex:roman(raw==='μ'?'\\mu':raw),unit:true};
        if(atom&&((raw==='m'&&/^表示米/.test(text.slice(i)))||(/^[np]$/.test(raw)&&/^型/.test(text.slice(i)))))atom={...atom,tex:roman(raw)};
        if(atom&&!protectedWords.has(raw))tokens.push({...atom,start,end:i,raw:raw==='log'&&atom.fn?'log₁₀':raw});
        else tokens.push({kind:'text',raw,start,end:i});
        continue;
      }
      if(opMap[c]){i++;tokens.push({kind:'op',raw:c,tex:opMap[c],start,end:i});continue;}
      if(/[ \t\r\n]/.test(c)){while(/[ \t\r\n]/.test(text[i]||'')&&i<text.length)i++;tokens.push({kind:'space',raw:text.slice(start,i),start,end:i});continue;}
      i++;tokens.push({kind:'text',raw:c,start,end:i});
    }
    return tokens;
  }
  function compile(tokens,unitContext){
    const ts=tokens.filter(t=>t.kind!=='space').map(t=>({...t}));
    let inUnits=unitContext;
    for(let i=0;i<ts.length;i++){
      const t=ts[i],prev=ts[i-1];
      if(rel.has(t.tex)||['+','-',','].includes(t.tex))inUnits=unitContext;
      const afterNumber=prev?.kind==='number'||(prev?.kind==='sup'&&ts[i-2]?.kind==='number');
      const quantity=afterNumber&&unitSingles.has(t.raw)&&t.raw!=='m'&&!(t.raw==='C'&&ts.some(a=>/^C/.test(a.raw)&&a!==t&&a.kind==='atom'));
      if(t.unit)inUnits=true;
      if(t.kind==='atom'&&unitSingles.has(t.raw)&&(inUnits||quantity)) {t.tex=roman(t.raw);t.unit=true;inUnits=true;}
      if(t.raw==='d'&&ts[i+1]?.tex==='('){t.tex='\\mathrm{d}';t.fn=true;}
    }
    let at=0;
    const peek=()=>ts[at];
    function primary(){
      const t=ts[at++];if(!t)return '';
      if(t.tex==='√'){let value=power();if(/^\\left[([]/.test(value)&&/\\right[)\]]$/.test(value))value=value.slice(6,-7);return '\\sqrt{'+value+'}';}
      if(t.tex==='+'||t.tex==='-')return t.tex+power();
      if(t.tex==='('||t.tex==='['||t.tex==='{'){
        const close={'(':')','[':']','{':'}'}[t.tex];
        const inside=expression(new Set([close]));
        if(peek()?.tex===close)at++;
        if(t.tex==='{')return '{'+inside+'}';
        return '\\left'+t.tex+inside+'\\right'+close;
      }
      if(t.tex==='|'){
        if(ts.slice(at).some(x=>x.tex==='|')){const inside=expression(new Set(['|']));if(peek()?.tex==='|')at++;return '\\left|'+inside+'\\right|';}
        return '\\vert ';
      }
      if(t.kind==='sup')return '{}^{'+t.tex+'}';
      if(t.fn){
        if(peek()&&!rel.has(peek().tex)&&!['+','-',',',')',']','}'].includes(peek().tex))return t.tex+' '+power();
        return t.tex;
      }
      return t.tex||t.raw;
    }
    function power(){
      let left=primary();
      while(peek()&&(peek().kind==='sup'||peek().tex==='^'||peek().tex==="'"||peek().tex==='%')){
        const op=ts[at++];
        if(op.kind==='sup')left+='^{'+op.tex+'}';
        else if(op.tex==="'")left+="'";
        else if(op.tex==='%')left+='\\%';
        else {let exponent=primary();if(exponent.startsWith('\\left(')&&exponent.endsWith('\\right)'))exponent=exponent.slice(6,-7);left+='^{'+exponent+'}';}
      }
      return left;
    }
    function product(stops){
      let left=power();
      while(peek()&&!stops.has(peek().tex)&&!rel.has(peek().tex)&&!['+','-',',',')',']','}'].includes(peek().tex)){
        const op=peek();
        if(op.tex==='/'){at++;const right=power();left='\\frac{'+left+'}{'+right+'}';}
        else if(op.tex==='\\cdot'||op.tex==='\\times'){at++;left+=' '+op.tex+' '+power();}
        else {const unit=!!op.unit;left+=(unit?'\\,':' ')+power();}
      }
      return left;
    }
    function add(stops){let left=product(stops);while(peek()&&!stops.has(peek().tex)&&['+','-'].includes(peek().tex)){const op=ts[at++].tex;left+=' '+op+' '+product(stops);}return left;}
    function expression(stops=new Set()){
      let left=add(stops);
      while(peek()&&!stops.has(peek().tex)){
        const op=ts[at++];
        if(rel.has(op.tex)||op.tex===',')left+=' '+op.tex+' '+add(stops);
        else left+=' '+(op.tex||op.raw);
      }
      return left;
    }
    return expression().trim();
  }
  const cache=new Map();
  const conversions=[];
  const unknown=new Map();
  function renderMath(raw,tex){
    if(!cache.has(tex))cache.set(tex,katex.renderToString(tex,{displayMode:false,throwOnError:true,strict:'ignore',output:'htmlAndMathml'}));
    return '<span class="math-inline" data-raw="'+escape(raw)+'" data-latex="'+escape(tex)+'">'+cache.get(tex)+'</span>';
  }
  function highlight(text,words){
    if(!words?.length)return escape(text);
    const safe=words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    const re=new RegExp(safe.join('|'),'gi');let out='',at=0;
    for(const m of text.matchAll(re)){out+=escape(text.slice(at,m.index))+'<mark>'+escape(m[0])+'</mark>';at=m.index+m[0].length;}
    return out+escape(text.slice(at));
  }
  function formatText(text,options={}){
    let prefix='';
    if(options.heading){const match=text.match(/^\d+(?:\.\d+)*\.?\s+/);if(match){prefix=escape(match[0]);text=text.slice(match[0].length);}}
    const tokens=lex(text);let html=prefix,i=0;
    while(i<tokens.length){
      if(tokens[i].kind==='text'||tokens[i].kind==='space'){
        const first=i;while(i<tokens.length&&(tokens[i].kind==='text'||tokens[i].kind==='space')){
          const t=tokens[i++];if(t.kind==='text'&&/^[A-Za-z]{2,}/.test(t.raw)&&!protectedWords.has(t.raw)&&!/^MATHPLACEHOLDER\d+END$/.test(t.raw))unknown.set(t.raw,(unknown.get(t.raw)||0)+1);
        }
        html+=highlight(text.slice(tokens[first].start,tokens[i-1].end),options.highlight);
        continue;
      }
      const start=i;let end=i;
      while(end<tokens.length&&tokens[end].kind!=='text')end++;
      while(end>start&&tokens[end-1].kind==='space')end--;
      const group=tokens.slice(start,end);
      const raw=text.slice(group[0].start,group[group.length-1].end);
      const hasValue=group.some(t=>t.kind==='atom'||t.kind==='number'||t.kind==='sup'||['\\infty','\\partial','\\int','√','\\square','\\to'].includes(t.tex));
      if(!hasValue&&group.every(t=>['(',')','[',']','{','}',','].includes(t.tex))){html+=escape(raw);i=end;continue;}
      const left=text.slice(0,group[0].start).split(/[。；\n]/).pop();
      const lastUnit=left.lastIndexOf('单位'),lastVariable=Math.max(left.lastIndexOf('记作'),left.lastIndexOf('记为'),left.lastIndexOf('符号'));
      const unitContext=lastUnit>=0&&lastUnit>lastVariable;
      let tex=compile(group,unitContext);
      if(!tex){html+=escape(raw);i=end;continue;}
      const math=renderMath(raw,tex);
      html+=options.highlight?.some(w=>raw.toLowerCase().includes(w.toLowerCase()))?'<mark class="math-hit">'+math+'</mark>':math;
      conversions.push({raw,tex,context:options.context||''});i=end;
    }
    return html;
  }
  // Marked has already handled Markdown syntax; only real text nodes are transformed.
  function formatHTML(html,options={}){
    const stack=[];const voids=new Set(['br','img','hr','input','meta','link','wbr','source']);
    return html.replace(/<[^>]*>|[^<]+/g,token=>{
      if(token.startsWith('<')){
        const close=token.match(/^<\/([\w-]+)/),open=token.match(/^<([\w-]+)/);
        if(close){const index=stack.lastIndexOf(close[1].toLowerCase());if(index>=0)stack.splice(index);}
        else if(open&&!voids.has(open[1].toLowerCase())&&!/\/>$/.test(token))stack.push(open[1].toLowerCase());
        return token;
      }
      if(stack.some(tag=>['script','style','pre','code'].includes(tag)))return token;
      const text=decode(token);
      if(!text.trim())return token;
      const heading=stack.some(tag=>/^h[1-6]$/.test(tag));
      if(options.termRefs&&!stack.some(tag=>tag==='a'||tag==='dfn')){
        const regex=options.termRefs.regex;regex.lastIndex=0;let out='',at=0;
        for(const match of text.matchAll(regex)){
          out+=formatText(text.slice(at,match.index),{...options,heading});
          const term=options.termRefs.byName.get(match[0]);
          out+='<a class="term-ref" href="'+escape(options.termRefs.base+term.href+'#'+term.id)+'" title="查看首次解释：'+escape(term.section)+'">'+formatText(match[0],{...options,heading:false})+'</a>';
          at=match.index+match[0].length;
        }
        return out+formatText(text.slice(at),{...options,heading});
      }
      return formatText(text,{...options,heading});
    });
  }
  function normalizeDisplay(tex){
    return tex.replace(/\bNM_([HL])/g,'\\mathrm{NM}_{$1}').replace(/_\{(DD|GS|DS|SG|SD|SB|BS|DSAT|Tn|Tp|ov|ds|ox|int|ext|eq|wire|size|clk|sub|sc|leak|peak|avg|total|min|opt|chain)\}/g,(_,s)=>'_{'+roman(s)+'}');
  }
  return {formatText,formatHTML,normalizeDisplay,lex,compile,conversions,unknown,inferred,escape};
});
