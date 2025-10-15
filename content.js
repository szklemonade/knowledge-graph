(() => {
  const W=innerWidth, H=innerHeight, BG='#212529', TEXT='#e9ecef';
  document.getElementById('km-overlay')?.remove();
  const overlay=document.createElement('div'); overlay.id='km-overlay'; overlay.style='position:fixed;inset:0;background:'+BG+';z-index:999999;color:'+TEXT+';font-family:sans-serif';
  const header=document.createElement('div'); header.style='position:absolute;top:8px;left:12px;right:12px;display:flex;gap:8px;align-items:center';
  header.innerHTML='<strong>Knowledge Map</strong><label style="margin-left:auto">反発 <input id="rep" type="range" min="0" max="100" value="35"><span id="rval">35</span></label><button id="zin">＋</button><button id="zout">−</button><button id="z1">100%</button><button id="zfit">Fit</button><button id="close">閉じる</button>';
  overlay.appendChild(header);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('width',W); svg.setAttribute('height',H); overlay.appendChild(svg); document.body.appendChild(overlay);
  const gW=document.createElementNS('http://www.w3.org/2000/svg','g'), gE=document.createElementNS('http://www.w3.org/2000/svg','g'), gN=document.createElementNS('http://www.w3.org/2000/svg','g'); gW.appendChild(gE); gW.appendChild(gN); svg.appendChild(gW);

  function internal(a){ try{const u=new URL(a.href, location.origin); return u.hostname.endsWith('wikipedia.org') && /^\/wiki\//.test(u.pathname) && !u.pathname.includes(':'); }catch{return false} }
  function tFrom(h){ try{const u=new URL(h, location.origin); return decodeURIComponent(u.pathname.replace(/^\/wiki\//,'')).replace(/_/g,' ')}catch{return h} }
  function pFrom(t){ return '/wiki/'+encodeURIComponent(t.replace(/ /g,'_')); }

  const title=(document.getElementById('firstHeading')?.textContent||document.title).trim();
  const centerId='__center__:'+location.href;
  const as=Array.from(document.querySelectorAll('#mw-content-text a[href]')).filter(internal);
  const seen=new Set(); const list=[]; for(const a of as){ const t=tFrom(a.href); if(seen.has(t)) continue; seen.add(t); list.push({t, u:new URL(a.href, location.origin).href}); if(list.length>=60) break; }

  const nodes=[{id:centerId,l:title,center:true}], edges=[];
  for(const d of list){ const id=pFrom(d.t); nodes.push({id,l:d.t,u:d.u}); edges.push({s:centerId,t:id}); }

  const CX=W/2, CY=H/2, R=Math.min(W,H)*0.4; nodes[0].x=CX; nodes[0].y=CY; nodes[0].vx=0; nodes[0].vy=0;
  const leaves=nodes.slice(1); leaves.forEach((n,i)=>{ const th=(i/leaves.length)*Math.PI*2; n.x=CX+R*Math.cos(th); n.y=CY+R*Math.sin(th); n.vx=0; n.vy=0; });

  function fit(ns,w,h,p=48){ let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9; for(const n of ns){ if(n.x<minX)minX=n.x; if(n.x>maxX)maxX=n.x; if(n.y<minY)minY=n.y; if(n.y>maxY)maxY=n.y; } const sx=(w-2*p)/Math.max(1,maxX-minX), sy=(h-2*p)/Math.max(1,maxY-minY); const s=Math.min(sx,sy,1); for(const n of ns){ n.x=(n.x-minX)*s+p; n.y=(n.y-minY)*s+p; } } fit(nodes,W,H,48);

  const edgeEls=edges.map(e=>{ const l=document.createElementNS('http://www.w3.org/2000/svg','line'); l.setAttribute('stroke','#9aa0a6'); l.setAttribute('stroke-width','1.5'); gE.appendChild(l); return {e,el:l}; });
  const nodeEls=nodes.map(n=>{ const g=document.createElementNS('http://www.w3.org/2000/svg','g'); const r=n.center?26:16;
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle'); c.setAttribute('r',r); c.setAttribute('fill','#f8f9fa'); c.setAttribute('stroke','#ced4da'); c.setAttribute('stroke-width',n.center?2.4:1.4); g.appendChild(c);
    const t=document.createElementNS('http://www.w3.org/2000/svg','text'); t.setAttribute('text-anchor','middle'); t.setAttribute('y', String(r+12)); t.setAttribute('font-size', n.center?'12':'11'); t.setAttribute('fill', '#e9ecef'); t.textContent = n.l; g.appendChild(t);
    if(n.u){ g.style.cursor='pointer'; g.addEventListener('click', ev=>{ ev.stopPropagation(); location.href=n.u; }); }
    if(!n.center){ let drag=false,ox=0,oy=0; g.addEventListener('mousedown', ev=>{ drag=true; ox=ev.clientX-(n.x||0); oy=ev.clientY-(n.y||0); ev.stopPropagation(); }); window.addEventListener('mousemove', ev=>{ if(!drag) return; n.x=ev.clientX-ox; n.y=ev.clientY-oy; n.vx=n.vy=0; tick(); }); window.addEventListener('mouseup', ()=> drag=false); }
    gN.appendChild(g); return {n,el:g};
  });

  function tick(){ for(const {e,el} of edgeEls){ const s=nodes[0]; const t=nodes.find(n=>n.id===e.t); el.setAttribute('x1', s.x); el.setAttribute('y1', s.y); el.setAttribute('x2', t.x); el.setAttribute('y2', t.y); } for(const {n,el} of nodeEls) el.setAttribute('transform', 'translate('+n.x+','+n.y+')'); } tick();

  const PAD=32, RP=1500, K=0.02, D=0.86, TARGET=Math.min(W,H)*0.35; const rep=document.getElementById('rep'), rval=document.getElementById('rval');
  let t=0;
  function simulate(){
    const s=(Number(rep.value)||0)/100;
    for(let i=1;i<nodes.length;i++){ for(let j=i+1;j<nodes.length;j++){ const a=nodes[i],b=nodes[j]; const dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy+0.01; const k=(RP*s)/d2; const fx=k*dx, fy=k*dy; a.vx=(a.vx||0)+fx; a.vy=(a.vy||0)+fy; b.vx=(b.vx||0)-fx; b.vy=(b.vy||0)-fy; } }
    for(const n of leaves){ const dx=n.x-nodes[0].x, dy=n.y-nodes[0].y; const d=Math.sqrt(dx*dx+dy*dy)||0.0001; const f=(d-TARGET)*K; n.vx=(n.vx||0)-(dx/d)*f; n.vy=(n.vy||0)-(dy/d)*f; }
    for(const n of leaves){ n.vx=(n.vx||0)*D; n.vy=(n.vy||0)*D; n.x+=n.vx; n.y+=n.vy; n.x=Math.max(PAD, Math.min(W-PAD, n.x)); n.y=Math.max(PAD, Math.min(H-PAD, n.y)); }
    t+=1; nodes[0].x = CX + 4*Math.sin(t*0.02); nodes[0].y = CY + 3*Math.cos(t*0.018); nodes[0].vx=0; nodes[0].vy=0;
  }
  let rid=null; function frame(){ simulate(); tick(); rid=requestAnimationFrame(frame);} frame(); rep.addEventListener('input', ()=> rval.textContent=String(rep.value));

  const view={k:1,minK:0.3,maxK:3}; const apply=()=> gW.setAttribute('transform','scale('+view.k+')');
  document.getElementById('zin').addEventListener('click', ()=>{ view.k=Math.min(view.maxK, view.k*1.2); apply(); });
  document.getElementById('zout').addEventListener('click', ()=>{ view.k=Math.max(view.minK, view.k/1.2); apply(); });
  document.getElementById('z1').addEventListener('click', ()=>{ view.k=1; apply(); });
  document.getElementById('zfit').addEventListener('click', ()=>{ view.k=1; apply(); });
  document.getElementById('close').addEventListener('click', ()=>{ if(rid) cancelAnimationFrame(rid); overlay.remove(); });
})();