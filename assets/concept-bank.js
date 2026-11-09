(()=>{
 'use strict';
 let mode='memorize';try{mode=localStorage.getItem('dic-concept-mode')||mode;}catch{}
 const button=document.getElementById('concept-mode-toggle'),label=document.getElementById('concept-mode-label');
 function apply(){const selfTest=mode==='test';document.querySelectorAll('.discussion-answer').forEach(d=>d.open=!selfTest);button.textContent=selfTest?'切换为背诵模式':'切换为自测模式';label.textContent=selfTest?'自测模式：点击题后条目查看答案':'背诵模式：显示论述答案';try{localStorage.setItem('dic-concept-mode',mode);}catch{}}
 button?.addEventListener('click',()=>{mode=mode==='test'?'memorize':'test';apply();});if(button)apply();
 const controls=['concept-kind','concept-chapter','concept-origin'].map(id=>document.getElementById(id));
 function filter(){const [kind,ch,origin]=controls.map(c=>c.value);let count=0;document.querySelectorAll('[data-concept-kind]').forEach(li=>{const show=(kind==='all'||li.dataset.conceptKind===kind)&&(ch==='all'||li.dataset.conceptChapter===ch)&&(origin==='all'||li.dataset.conceptOrigin===origin);li.hidden=!show;if(show)count++;});document.querySelectorAll('.concept-index-group').forEach(g=>g.hidden=![...g.querySelectorAll('[data-concept-kind]')].some(li=>!li.hidden));document.getElementById('concept-filter-count').textContent='显示 '+count+' 项';}
 if(controls.every(Boolean)){controls.forEach(c=>c.addEventListener('change',filter));filter();}
 if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));let el=target?.parentElement;while(el){if(el.tagName==='DETAILS')el.open=true;el=el.parentElement;}}
})();
