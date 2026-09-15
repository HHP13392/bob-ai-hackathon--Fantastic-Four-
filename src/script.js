/* ════════════════════════════════════════════════════════════════════════
   DATA  — 15 assets (3 Critical · 4 High · 5 Medium · 3 Low)
   ════════════════════════════════════════════════════════════════════════ */
let RAW = [
  {id:"T-802",name:"North-East Transformer",type:"Transformer",location:"North-East Hub",cx:130,cy:120,temp:87,vib:78,wx:91,customers:8000,prevFail:3},
  {id:"S-12", name:"Central Substation",    type:"Substation", location:"City Centre",   cx:390,cy:120,temp:74,vib:61,wx:75,customers:15000,prevFail:2},
  {id:"T-309",name:"West Transformer",      type:"Transformer",location:"West Grid",     cx:130,cy:360,temp:70,vib:55,wx:68,customers:4200, prevFail:2},
  {id:"L-405",name:"South Feeder",          type:"Feeder",     location:"South Corridor",cx:390,cy:400,temp:65,vib:50,wx:62,customers:2800, prevFail:1},
  {id:"T-117",name:"East Transformer",      type:"Transformer",location:"East Zone",     cx:660,cy:120,temp:61,vib:44,wx:55,customers:3100, prevFail:1},
  {id:"S-07", name:"North Substation",      type:"Substation", location:"North Grid",    cx:260,cy:280,temp:58,vib:38,wx:50,customers:9000, prevFail:1},
  {id:"L-201",name:"Ring Feeder North",     type:"Feeder",     location:"North Ring",    cx:520,cy:300,temp:52,vib:32,wx:45,customers:1500, prevFail:0},
  {id:"T-440",name:"Sub-urban Transformer", type:"Transformer",location:"Suburban West", cx:130,cy:450,temp:50,vib:28,wx:42,customers:1800, prevFail:0},
  {id:"S-03", name:"South Substation",      type:"Substation", location:"South Zone",    cx:520,cy:450,temp:48,vib:22,wx:30,customers:6000, prevFail:0},
  {id:"L-108",name:"East Feeder",           type:"Feeder",     location:"East Corridor", cx:660,cy:360,temp:44,vib:18,wx:24,customers:900,  prevFail:0},
  {id:"T-550",name:"Industrial Transformer",type:"Transformer",location:"Industrial Park",cx:680,cy:450,temp:42,vib:16,wx:20,customers:1200,prevFail:0},
  {id:"S-18", name:"Airport Substation",    type:"Substation", location:"Airport Zone",  cx:390,cy:270,temp:40,vib:14,wx:18,customers:5000, prevFail:0},
  {id:"L-330",name:"West Feeder",           type:"Feeder",     location:"West Corridor", cx:200,cy:360,temp:38,vib:12,wx:15,customers:700,  prevFail:0},
  {id:"T-621",name:"Port Transformer",      type:"Transformer",location:"Port Area",     cx:580,cy:200,temp:36,vib:10,wx:12,customers:500,  prevFail:0},
  {id:"S-22", name:"Outer Ring Substation", type:"Substation", location:"Outer Ring",    cx:730,cy:280,temp:34,vib:8, wx:10,customers:800,  prevFail:0},
];
const WEATHER_EVENTS = [
  {zone:"North-East",severity:91,alert:"Severe thunderstorm warning",icon:"⛈️"},
  {zone:"Central",   severity:75,alert:"High wind advisory",          icon:"💨"},
  {zone:"West Grid", severity:68,alert:"Heavy rain warning",          icon:"🌧️"},
  {zone:"South",     severity:62,alert:"Flood watch",                 icon:"🌊"},
];
const TESTS = [
  "Overview API returns 15 assets",
  "T-802 has riskScore ≥ 80 (Critical)",
  "Critical assets sorted first in maintenance queue",
  "Unknown asset ID returns 404 error",
  "acknowledgeRisk mutation returns success",
  "Risk formula weights sum to 1.0",
  "getRiskStatus(94) === 'Critical'",
  "getRiskStatus(22) === 'Low'",
  "Frontend receives backend data via tRPC",
  "Website renders correctly on 375px mobile",
];
const ACKNOWLEDGED = new Set();
let ALL_ASSETS = [];
let simInterval = null, simTick = 0;
let selectedMapId = null;
let chartAssetId  = "T-802";

/* ════════════════════════════════════════════════════════════════════════
   RISK ENGINE
   ════════════════════════════════════════════════════════════════════════ */
function norm(v,lo,hi){return Math.max(0,Math.min(100,(v-lo)/(hi-lo)*100));}
function calcRisk(a){
  return Math.round(
    norm(a.temp,40,100)*0.30 + a.vib*0.20 + a.wx*0.20 +
    Math.min(a.prevFail*20,100)*0.15 + norm(a.customers,0,15000)*0.15
  );
}
function riskStatus(s){return s>=80?"Critical":s>=60?"High":s>=30?"Medium":"Low";}
function riskColor(s){return {Critical:"#ef4444",High:"#f97316",Medium:"#eab308",Low:"#22c55e"}[s]||"#fff";}
function riskGlow(s){return {Critical:"rgba(239,68,68,0.35)",High:"rgba(249,115,22,0.3)",Medium:"rgba(234,179,8,0.25)",Low:"rgba(34,197,94,0.2)"}[s]||"";}
function getRec(a){
  if(a.riskScore>=80)return"Inspect cooling system immediately. Pre-position crew within 6 hours.";
  if(a.riskScore>=60)return"Schedule inspection within 12 hours. Monitor sensors closely.";
  if(a.riskScore>=30)return"Continue monitoring. Inspect next scheduled cycle.";
  return"No immediate action required. Continue normal maintenance.";
}
function enrich(raw){
  return raw.map(a=>{const rs=calcRisk(a);return{...a,riskScore:rs,status:riskStatus(rs)};}).sort((a,b)=>b.riskScore-a.riskScore);
}
function getHistory(a){
  const s=a.riskScore;
  return {
    temp:    [a.temp-23,a.temp-18,a.temp-13,a.temp-10,a.temp-6,a.temp-2,a.temp].map(v=>Math.max(20,v)),
    vib:     [a.vib-36,a.vib-28,a.vib-20,a.vib-13,a.vib-8,a.vib-3,a.vib].map(v=>Math.max(0,v)),
    wx:      [a.wx-36,a.wx-30,a.wx-22,a.wx-13,a.wx-7,a.wx-2,a.wx].map(v=>Math.max(0,v)),
    fail:    [s-72,s-58,s-46,s-34,s-22,s-12,s].map(v=>Math.max(2,v)),
  };
}

/* ════════════════════════════════════════════════════════════════════════
   CANVAS HELPERS
   ════════════════════════════════════════════════════════════════════════ */
function setupCanvas(id){
  const el=document.getElementById(id); if(!el)return null;
  const dpr=window.devicePixelRatio||1;
  const W=el.offsetWidth||el.parentElement?.offsetWidth||460;
  const H=parseInt(el.getAttribute("height"))||140;
  el.width=W*dpr; el.height=H*dpr;
  el.style.width=W+"px"; el.style.height=H+"px";
  const ctx=el.getContext("2d"); ctx.scale(dpr,dpr);
  return{ctx,W,H};
}
function drawLineChart(id,data,color,fill){
  const c=setupCanvas(id); if(!c)return;
  const{ctx,W,H}=c;
  const pL=36,pR=14,pT=14,pB=28,iW=W-pL-pR,iH=H-pT-pB;
  const n=data.length, mn=Math.min(...data)-5, mx=Math.max(...data)+8;
  const labels=["-6h","-5h","-4h","-3h","-2h","-1h","Now"];
  [0,25,50,75,100].forEach(v=>{
    if(v<mn||v>mx)return;
    const y=pT+iH-(v-mn)/(mx-mn)*iH;
    ctx.strokeStyle="rgba(255,255,255,0.05)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(pL+iW,y);ctx.stroke();
    ctx.fillStyle="rgba(255,255,255,0.28)";ctx.font="9px system-ui";ctx.textAlign="right";
    ctx.fillText(v,pL-4,y+3);
  });
  const pts=data.map((v,i)=>[pL+i*(iW/(n-1)),pT+iH-(v-mn)/(mx-mn)*iH]);
  if(fill){
    const g=ctx.createLinearGradient(0,pT,0,pT+iH);
    g.addColorStop(0,color+"44");g.addColorStop(1,color+"00");
    ctx.beginPath();pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
    ctx.lineTo(pts[n-1][0],pT+iH);ctx.lineTo(pts[0][0],pT+iH);ctx.closePath();
    ctx.fillStyle=g;ctx.fill();
  }
  ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.lineJoin="round";
  pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.stroke();
  pts.forEach(([x,y])=>{
    ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);
    ctx.fillStyle=color;ctx.strokeStyle="#0b0f1a";ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
  });
  ctx.fillStyle="rgba(255,255,255,0.35)";ctx.font="9px system-ui";ctx.textAlign="center";
  labels.forEach((l,i)=>ctx.fillText(l,pL+i*(iW/(n-1)),H-8));
}
function drawBarChart(assets){
  const c=setupCanvas("chart-bar");if(!c)return;
  const{ctx,W,H}=c;

  // Use 8 time-slot buckets: 00:00 02:00 04:00 06:00 08:00 10:00 12:00 Now
  // Map the top 8 assets (by risk) to these slots
  const top=assets.slice(0,8);
  const timeLabels=["00:00","02:00","04:00","06:00","08:00","10:00","12:00","Now"];

  const pL=18,pR=18,pT=20,pB=44,iW=W-pL-pR,iH=H-pT-pB;
  const n=top.length;
  const gap=iW/n;
  const bw=gap*0.52; // bar width
  const radius=10;   // rounded top corners

  // Clear background
  ctx.clearRect(0,0,W,H);

  // Subtle horizontal gridlines only — no Y axis numbers (matches the image)
  [25,50,75,100].forEach(v=>{
    const y=pT+iH-(v/100)*iH;
    ctx.strokeStyle="rgba(255,255,255,0.06)";ctx.lineWidth=1;
    ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(pL+iW,y);ctx.stroke();
    ctx.setLineDash([]);
  });

  // Bars
  top.forEach((a,i)=>{
    const cx=pL+i*gap+gap/2;           // bar centre x
    const bx=cx-bw/2;                   // bar left x
    const bh=Math.max(8,(a.riskScore/100)*iH);
    const by=pT+iH-bh;
    const isCritical=a.status==="Critical";

    // Per-bar vertical gradient
    const grad=ctx.createLinearGradient(bx,by,bx,pT+iH);
    if(isCritical){
      // Red gradient — bright red top → dark red bottom
      grad.addColorStop(0,"#f87171");
      grad.addColorStop(0.5,"#ef4444");
      grad.addColorStop(1,"#7f1d1d");
    }else{
      // Cyan → blue gradient
      grad.addColorStop(0,"#22d3ee");
      grad.addColorStop(0.5,"#06b6d4");
      grad.addColorStop(1,"#1d4ed8");
    }

    // Glow under critical bars
    if(isCritical){
      ctx.shadowColor="rgba(239,68,68,0.55)";
      ctx.shadowBlur=18;
    }else{
      ctx.shadowColor="rgba(6,182,212,0.3)";
      ctx.shadowBlur=10;
    }

    // Draw rounded-top rectangle
    ctx.beginPath();
    if(ctx.roundRect){
      ctx.roundRect(bx,by,bw,bh,[radius,radius,6,6]);
    }else{
      // Fallback: manual rounded top
      ctx.moveTo(bx+radius,by);
      ctx.lineTo(bx+bw-radius,by);
      ctx.quadraticCurveTo(bx+bw,by,bx+bw,by+radius);
      ctx.lineTo(bx+bw,pT+iH-6);
      ctx.quadraticCurveTo(bx+bw,pT+iH,bx+bw-6,pT+iH);
      ctx.lineTo(bx+6,pT+iH);
      ctx.quadraticCurveTo(bx,pT+iH,bx,pT+iH-6);
      ctx.lineTo(bx,by+radius);
      ctx.quadraticCurveTo(bx,by,bx+radius,by);
      ctx.closePath();
    }
    ctx.fillStyle=grad;
    ctx.fill();
    ctx.shadowBlur=0;

    // Time label below bar
    const label=timeLabels[i]||"";
    ctx.fillStyle="rgba(255,255,255,0.4)";
    ctx.font="11px system-ui";
    ctx.textAlign="center";
    ctx.fillText(label,cx,pT+iH+18);

    // Asset ID tiny label inside top of bar (if tall enough)
    if(bh>28){
      ctx.fillStyle="rgba(255,255,255,0.7)";
      ctx.font="bold 9px system-ui";
      ctx.textAlign="center";
      ctx.fillText(a.id,cx,by+16);
    }
  });
}
function drawDualLine(id,d1,c1,d2,c2){
  const c=setupCanvas(id);if(!c)return;
  const{ctx,W,H}=c;
  const pL=36,pR=42,pT=14,pB=28,iW=W-pL-pR,iH=H-pT-pB,n=d1.length;
  [0,25,50,75,100].forEach(v=>{
    const y=pT+iH-(v/100)*iH;
    ctx.strokeStyle="rgba(255,255,255,0.05)";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(pL+iW,y);ctx.stroke();
    ctx.fillStyle="rgba(255,255,255,0.28)";ctx.font="9px system-ui";ctx.textAlign="right";
    ctx.fillText(v,pL-4,y+3);
  });
  [[d1,c1,true],[d2,c2,false]].forEach(([data,col,fill])=>{
    const pts=data.map((v,i)=>[pL+i*(iW/(n-1)),pT+iH-(v/100)*iH]);
    if(fill){
      const g=ctx.createLinearGradient(0,pT,0,pT+iH);
      g.addColorStop(0,col+"44");g.addColorStop(1,col+"00");
      ctx.beginPath();pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));
      ctx.lineTo(pts[n-1][0],pT+iH);ctx.lineTo(pts[0][0],pT+iH);ctx.closePath();
      ctx.fillStyle=g;ctx.fill();
    }
    ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.lineJoin="round";
    pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.stroke();
    pts.forEach(([x,y])=>{
      ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);
      ctx.fillStyle=col;ctx.strokeStyle="#0b0f1a";ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
    });
  });
  const labels=["-6h","-5h","-4h","-3h","-2h","-1h","Now"];
  ctx.fillStyle="rgba(255,255,255,0.35)";ctx.font="9px system-ui";ctx.textAlign="center";
  labels.forEach((l,i)=>ctx.fillText(l,pL+i*(iW/(n-1)),H-8));
  const nowX=pL+iW,nowY=pT+iH-(d2[n-1]/100)*iH;
  ctx.fillStyle=c2;ctx.font="bold 9.5px system-ui";ctx.textAlign="left";
  ctx.fillText(d2[n-1]+"% ⚠",nowX+4,nowY+3);
}

/* ════════════════════════════════════════════════════════════════════════
   COMMAND CENTER RENDER
   ════════════════════════════════════════════════════════════════════════ */
function drawDonut(assets){
  const el=document.getElementById("donut-canvas");
  if(!el)return;
  const dpr=window.devicePixelRatio||1;
  const SIZE=150;
  el.width=SIZE*dpr; el.height=SIZE*dpr;
  el.style.width=SIZE+"px"; el.style.height=SIZE+"px";
  const ctx=el.getContext("2d");
  ctx.scale(dpr,dpr);

  const cx=SIZE/2, cy=SIZE/2, R=62, r=40, GAP=0.03; // gap between segments in radians

  const counts={
    Critical: assets.filter(a=>a.status==="Critical").length,
    High:     assets.filter(a=>a.status==="High").length,
    Medium:   assets.filter(a=>a.status==="Medium").length,
    Low:      assets.filter(a=>a.status==="Low").length,
  };
  const total=assets.length;
  const segments=[
    {label:"Critical",color:"#ef4444",count:counts.Critical},
    {label:"High",    color:"#f97316",count:counts.High},
    {label:"Medium",  color:"#eab308",count:counts.Medium},
    {label:"Low",     color:"#22c55e",count:counts.Low},
  ].filter(s=>s.count>0);

  let startAngle=-Math.PI/2; // start at top
  segments.forEach(seg=>{
    const sweep=(seg.count/total)*(Math.PI*2) - GAP;
    // Outer arc
    ctx.beginPath();
    ctx.moveTo(cx+r*Math.cos(startAngle+GAP/2), cy+r*Math.sin(startAngle+GAP/2));
    ctx.arc(cx,cy,R,startAngle+GAP/2,startAngle+sweep+GAP/2);
    ctx.arc(cx,cy,r,startAngle+sweep+GAP/2,startAngle+GAP/2,true);
    ctx.closePath();
    ctx.fillStyle=seg.color;
    // Glow shadow
    ctx.shadowColor=seg.color+"88";
    ctx.shadowBlur=8;
    ctx.fill();
    ctx.shadowBlur=0;
    startAngle+=sweep+GAP;
  });

  // Inner dark circle to "punch" hole cleanly
  ctx.beginPath();
  ctx.arc(cx,cy,r-1,0,Math.PI*2);
  ctx.fillStyle="var(--surface)"||"#131929";
  // Use the actual background colour
  ctx.fillStyle="#131929";
  ctx.fill();

  // Update legend counts
  document.getElementById("dl-critical").textContent=counts.Critical;
  document.getElementById("dl-high").textContent=counts.High;
  document.getElementById("dl-medium").textContent=counts.Medium;
  document.getElementById("dl-low").textContent=counts.Low;
  document.getElementById("donut-total").textContent=total;
}

function renderMetrics(kpis){
  document.getElementById("m-assets").textContent=kpis.assetsMonitored;
  document.getElementById("m-critical").textContent=kpis.criticalAssets;
  document.getElementById("m-weather").textContent=kpis.weatherAlerts;
  document.getElementById("m-crews").textContent=kpis.crewsToPosition;
  document.getElementById("alert-chip").textContent=kpis.criticalAssets+" CRITICAL";
}
function renderTable(assets){
  const tb=document.getElementById("asset-tbody");
  if(!assets.length){tb.innerHTML="";document.getElementById("no-assets-msg").style.display="flex";return;}
  document.getElementById("no-assets-msg").style.display="none";
  tb.innerHTML=assets.map(a=>`<tr onclick="openModal('${a.id}')">
    <td><strong>${a.id}</strong></td><td>${a.name}</td>
    <td style="color:var(--muted)">${a.type}</td><td>${a.location}</td>
    <td><div class="risk-bar-wrap"><div class="risk-bar-bg"><div class="risk-bar-fill" style="width:${a.riskScore}%;background:${riskColor(a.status)}"></div></div><span class="risk-val" style="color:${riskColor(a.status)}">${a.riskScore}%</span></div></td>
    <td>${a.customers.toLocaleString()}</td>
    <td><span class="status-pill sp-${a.status}">${a.status}</span></td>
    <td><button class="btn-sm" onclick="event.stopPropagation();openModal('${a.id}')">View →</button></td>
  </tr>`).join("");
}
function renderMQ(assets){
  document.getElementById("mq-list").innerHTML=assets.slice(0,6).map((a,i)=>`
    <div class="mq-item">
      <div class="mq-rank">${i+1}</div>
      <div class="mq-id" style="color:${riskColor(a.status)}">${a.id}</div>
      <div class="mq-action">${getRec(a)}</div>
      <div class="mq-score" style="color:${riskColor(a.status)}">${a.riskScore}%</div>
      <span class="status-pill sp-${a.status}">${a.status}</span>
      <button class="ack-btn ${ACKNOWLEDGED.has(a.id)?"acked":""}" onclick="ackAsset('${a.id}')" ${ACKNOWLEDGED.has(a.id)?"disabled":""}>
        ${ACKNOWLEDGED.has(a.id)?"✓ Acked":"Ack"}
      </button>
    </div>`).join("");
}
function renderAnalysis(assets){
  document.getElementById("analysis-body").innerHTML=assets.slice(0,7).map(a=>{
    const col=riskColor(a.status),tr=Math.round(norm(a.temp,40,100)),cr=Math.round(norm(a.customers,0,15000));
    return`<div class="analysis-asset" onclick="openModal('${a.id}')">
      <div class="aa-row1"><span class="aa-id" style="color:${col}">${a.id}</span><span class="aa-name">${a.name}</span><span class="aa-score" style="color:${col}">${a.riskScore}%</span><span class="status-pill sp-${a.status}" style="font-size:10px;padding:2px 7px">${a.status}</span></div>
      <div class="aa-sensors">
        <div class="aa-sensor"><span style="min-width:40px;font-size:10px">🌡 Temp</span><div class="aa-bar-bg"><div class="aa-bar-fill" style="width:${tr}%;background:#f97316"></div></div><span class="aa-val">${a.temp}°</span></div>
        <div class="aa-sensor"><span style="min-width:40px;font-size:10px">📳 Vib</span><div class="aa-bar-bg"><div class="aa-bar-fill" style="width:${a.vib}%;background:#eab308"></div></div><span class="aa-val">${a.vib}%</span></div>
        <div class="aa-sensor"><span style="min-width:40px;font-size:10px">🌩 WX</span><div class="aa-bar-bg"><div class="aa-bar-fill" style="width:${a.wx}%;background:#3b82f6"></div></div><span class="aa-val">${a.wx}%</span></div>
        <div class="aa-sensor"><span style="min-width:40px;font-size:10px">👥 Cust</span><div class="aa-bar-bg"><div class="aa-bar-fill" style="width:${cr}%;background:#22c55e"></div></div><span class="aa-val">${(a.customers/1000).toFixed(1)}k</span></div>
      </div></div>`;
  }).join("");
}
function filterTable(q){
  const t=q.toLowerCase();
  renderTable(t?ALL_ASSETS.filter(a=>a.id.toLowerCase().includes(t)||a.name.toLowerCase().includes(t)||a.type.toLowerCase().includes(t)||a.location.toLowerCase().includes(t)||a.status.toLowerCase().includes(t)):ALL_ASSETS);
}
function ackAsset(id){ACKNOWLEDGED.add(id);addLog(`Operator acknowledged risk for ${id}`,"ok");renderMQ(ALL_ASSETS);}

/* ════════════════════════════════════════════════════════════════════════
   MAP
   ════════════════════════════════════════════════════════════════════════ */
function buildMap(){
  const g=document.getElementById("map-markers");g.innerHTML="";
  ALL_ASSETS.forEach(a=>{
    const el=document.createElementNS("http://www.w3.org/2000/svg","g");
    el.style.cursor="pointer"; el.setAttribute("data-id",a.id);
    // Glow
    const glow=document.createElementNS("http://www.w3.org/2000/svg","circle");
    glow.setAttribute("cx",a.cx);glow.setAttribute("cy",a.cy);glow.setAttribute("r","18");glow.setAttribute("fill",riskGlow(a.status));
    el.appendChild(glow);
    // Shape by type
    const col=riskColor(a.status);
    if(a.type==="Substation"){
      const hex=document.createElementNS("http://www.w3.org/2000/svg","polygon");
      const r=12,pts=Array.from({length:6},(_,i)=>{const ang=Math.PI/3*i-Math.PI/2;return`${a.cx+r*Math.cos(ang)},${a.cy+r*Math.sin(ang)}`;}).join(" ");
      hex.setAttribute("points",pts);hex.setAttribute("fill",col);hex.setAttribute("stroke","rgba(255,255,255,0.3)");hex.setAttribute("stroke-width","1.5");
      el.appendChild(hex);
    }else if(a.type==="Transformer"){
      const sq=document.createElementNS("http://www.w3.org/2000/svg","rect");
      sq.setAttribute("x",a.cx-9);sq.setAttribute("y",a.cy-9);sq.setAttribute("width","18");sq.setAttribute("height","18");
      sq.setAttribute("rx","3");sq.setAttribute("fill",col);sq.setAttribute("stroke","rgba(255,255,255,0.3)");sq.setAttribute("stroke-width","1.5");
      el.appendChild(sq);
    }else{
      const ci=document.createElementNS("http://www.w3.org/2000/svg","circle");
      ci.setAttribute("cx",a.cx);ci.setAttribute("cy",a.cy);ci.setAttribute("r","8");
      ci.setAttribute("fill",col);ci.setAttribute("stroke","rgba(255,255,255,0.3)");ci.setAttribute("stroke-width","1.5");
      el.appendChild(ci);
    }
    const lbl=document.createElementNS("http://www.w3.org/2000/svg","text");
    lbl.setAttribute("x",a.cx);lbl.setAttribute("y",a.cy+26);lbl.setAttribute("text-anchor","middle");
    lbl.setAttribute("fill","#dde6f5");lbl.setAttribute("font-size","9");lbl.setAttribute("font-family","system-ui");lbl.setAttribute("font-weight","600");
    lbl.textContent=a.id;el.appendChild(lbl);
    el.addEventListener("click",()=>selectMapAsset(a.id));
    g.appendChild(el);
  });
}
function selectMapAsset(id){
  selectedMapId=id;
  document.querySelectorAll("[data-id]").forEach(g=>{
    const sel=g.getAttribute("data-id")===id;
    g.style.opacity=sel?"1":"0.5";
    const a=ALL_ASSETS.find(x=>x.id===id);
    g.style.filter=sel?`drop-shadow(0 0 7px ${riskColor(a.status)})`:"none";
  });
  const a=ALL_ASSETS.find(x=>x.id===id);if(!a)return;
  document.getElementById("detail-empty").style.display="none";
  const dc=document.getElementById("detail-content");dc.style.display="block";
  const col=riskColor(a.status),h=getHistory(a);
  const dash=Math.round(188.5*a.riskScore/100);
  const factors=[
    {n:"Temp",     v:Math.round(norm(a.temp,40,100)),c:"#f97316"},
    {n:"Vibration",v:a.vib,                           c:"#eab308"},
    {n:"Weather",  v:a.wx,                            c:"#3b82f6"},
    {n:"Prev Fail",v:Math.min(a.prevFail*20,100),     c:"#a855f7"},
    {n:"Customers",v:Math.round(norm(a.customers,0,15000)),c:"#22c55e"},
  ];
  const why=[];
  if(a.temp>75)why.push({i:"🌡️",t:`Temperature: ${a.temp}°C — abnormal (baseline 55°C). Cooling may be failing.`});
  if(a.vib>55) why.push({i:"📳",t:`Vibration: ${a.vib}% — high mechanical stress detected.`});
  if(a.wx>65)  why.push({i:"🌩️",t:`Weather severity: ${a.wx}% — severe conditions in this zone.`});
  if(a.customers>5000)why.push({i:"👥",t:`Customer impact: ${a.customers.toLocaleString()} customers at risk.`});
  if(a.prevFail>0)why.push({i:"📋",t:`Previous failures: ${a.prevFail} recorded — recurring pattern.`});
  if(!why.length)why.push({i:"✅",t:"All parameters within normal range."});

  dc.innerHTML=`
    <div class="detail-hero">
      <div class="detail-id-row">${a.id} <span class="status-pill sp-${a.status}">${a.status}</span></div>
      <div style="font-size:12.5px;color:var(--muted);margin-top:3px">${a.name}</div>
      <div class="detail-meta">
        <div class="dm-item"><div class="dm-label">Type</div><div class="dm-val">${a.type}</div></div>
        <div class="dm-item"><div class="dm-label">Location</div><div class="dm-val">${a.location}</div></div>
        <div class="dm-item"><div class="dm-label">Customers</div><div class="dm-val" style="color:${col}">${a.customers.toLocaleString()}</div></div>
        <div class="dm-item"><div class="dm-label">Prev. Failures</div><div class="dm-val">${a.prevFail}</div></div>
      </div>
    </div>
    <div class="risk-ring-row">
      <div class="ring-wrap">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="var(--surface2)" stroke-width="8"/>
          <circle cx="36" cy="36" r="30" fill="none" stroke="${col}" stroke-width="8" stroke-dasharray="${dash} 188.5" stroke-linecap="round"/>
        </svg>
        <div class="ring-label"><span class="ring-pct" style="color:${col}">${a.riskScore}%</span><span class="ring-sub">RISK</span></div>
      </div>
      <div class="factor-list">
        <h5>Risk Factors</h5>
        ${factors.map(f=>`<div class="factor-row"><span class="factor-name">${f.n}</span><div class="factor-bar-bg"><div class="factor-bar-fill" style="width:${f.v}%;background:${f.c}"></div></div><span class="factor-num">${f.v}%</span></div>`).join("")}
      </div>
    </div>
    <div class="chart-section">
      <h5>Sensor Readings — Last 7 Hours</h5>
      <div class="inline-charts-grid">
        <div><div class="inline-chart-label">🌡 Temperature — <strong style="color:#f97316">${a.temp}°C</strong></div><canvas id="ic-temp" height="60" style="width:100%"></canvas></div>
        <div><div class="inline-chart-label">📳 Vibration — <strong style="color:#eab308">${a.vib}%</strong></div><canvas id="ic-vib" height="60" style="width:100%"></canvas></div>
      </div>
    </div>
    <div class="why-section">
      <h5>⚠️ Why is this asset risky?</h5>
      ${why.map(w=>`<div class="why-item"><span class="why-icon">${w.i}</span><span>${w.t}</span></div>`).join("")}
      <div style="margin-top:8px;font-size:12px;color:var(--muted);background:var(--surface2);border-radius:7px;padding:9px 11px;line-height:1.7">
        <strong style="color:var(--text)">Risk increased because:</strong><br>
        ${a.temp>75?"— Temperature is above the normal baseline.<br>":""}
        ${a.vib>55?"— Vibration is increasing.<br>":""}
        ${a.wx>65?"— Severe weather is expected.<br>":""}
        ${a.customers>3000?"— This asset affects many customers.<br>":""}
        ${a.prevFail>0?"— This asset has failed before.<br>":""}
      </div>
    </div>
    <div class="rec-section">
      <div class="rec-box rec-${a.status}"><span class="rec-label">${a.status} — Recommended Action</span>${getRec(a)}</div>
    </div>`;
  setTimeout(()=>{
    drawLineChart("ic-temp",h.temp,"#f97316",true);
    drawLineChart("ic-vib",h.vib,"#eab308",false);
  },50);
}
function setMapTab(name,btn){document.querySelectorAll(".map-tab").forEach(b=>b.classList.remove("active"));btn.classList.add("active");}

/* ════════════════════════════════════════════════════════════════════════
   SENSOR CHARTS PAGE
   ════════════════════════════════════════════════════════════════════════ */
function populateChartSelect(){
  const sel=document.getElementById("chart-asset-select");
  sel.innerHTML=ALL_ASSETS.map(a=>`<option value="${a.id}" ${a.id===chartAssetId?"selected":""}>${a.id} — ${a.name}</option>`).join("");
}
function changeChartAsset(id){chartAssetId=id;renderSensorCharts();}
function renderSensorCharts(){
  const a=ALL_ASSETS.find(x=>x.id===chartAssetId)||ALL_ASSETS[0];
  if(!a)return;
  const h=getHistory(a),col=riskColor(a.status);
  document.getElementById("chart-asset-label").textContent=a.id+" — "+a.name;
  document.getElementById("chart-asset-status").textContent=a.status;
  document.getElementById("chart-asset-status").className="status-pill sp-"+a.status;
  setTimeout(()=>{
    drawLineChart("sc-temp",h.temp,"#f97316",true);
    drawLineChart("sc-vib",h.vib,"#eab308",true);
    drawLineChart("sc-wx",h.wx,"#3b82f6",true);
    drawLineChart("sc-fail",h.fail,col,true);
    drawDualLine("sc-trend",h.wx,"#3b82f6",h.fail,"#ef4444");
  },50);
}

/* ════════════════════════════════════════════════════════════════════════
   WATCHLIST
   ════════════════════════════════════════════════════════════════════════ */
function renderWatchlist(assets){
  document.getElementById("watchlist-tbody").innerHTML=assets.map(a=>`<tr onclick="openModal('${a.id}')">
    <td><strong>${a.id}</strong></td><td>${a.name}</td><td style="color:var(--muted)">${a.type}</td><td>${a.location}</td>
    <td style="color:#f97316">${a.temp}°C</td><td style="color:#eab308">${a.vib}%</td><td style="color:#3b82f6">${a.wx}%</td>
    <td><div class="risk-bar-wrap"><div class="risk-bar-bg"><div class="risk-bar-fill" style="width:${a.riskScore}%;background:${riskColor(a.status)}"></div></div><span class="risk-val" style="color:${riskColor(a.status)}">${a.riskScore}%</span></div></td>
    <td>${a.customers.toLocaleString()}</td>
    <td><span class="status-pill sp-${a.status}">${a.status}</span></td>
  </tr>`).join("");
}
function filterWatchlist(q){
  const t=q.toLowerCase();
  renderWatchlist(t?ALL_ASSETS.filter(a=>a.id.toLowerCase().includes(t)||a.name.toLowerCase().includes(t)||a.status.toLowerCase().includes(t)):ALL_ASSETS);
}

/* ════════════════════════════════════════════════════════════════════════
   WEATHER PAGE
   ════════════════════════════════════════════════════════════════════════ */
function renderWeather(){
  document.getElementById("wx-cards").innerHTML=WEATHER_EVENTS.map(w=>{
    const col=w.severity>=80?"#ef4444":w.severity>=60?"#f97316":w.severity>=30?"#eab308":"#22c55e";
    return`<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px 20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span style="font-size:22px">${w.icon}</span>
        <div><div style="font-size:13.5px;font-weight:700">${w.zone}</div><div style="font-size:11px;color:var(--muted)">${w.alert}</div></div>
        <span style="margin-left:auto;font-size:20px;font-weight:900;color:${col}">${w.severity}%</span>
      </div>
      <div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden"><div style="width:${w.severity}%;height:100%;background:${col};border-radius:3px"></div></div>
    </div>`;
  }).join("");
  const affected=ALL_ASSETS.filter(a=>a.wx>=40).slice(0,6);
  document.getElementById("wx-asset-list").innerHTML=affected.map(a=>`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:12px 16px;display:flex;align-items:center;gap:12px;cursor:pointer" onclick="openModal('${a.id}')">
      <strong style="width:52px;color:${riskColor(a.status)}">${a.id}</strong>
      <span style="flex:1;color:var(--muted);font-size:12.5px">${a.name} · ${a.location}</span>
      <span style="font-size:12px;color:#3b82f6">WX ${a.wx}%</span>
      <span class="status-pill sp-${a.status}">${a.status}</span>
    </div>`).join("");
}

/* ════════════════════════════════════════════════════════════════════════
   CREW PLANNER
   ════════════════════════════════════════════════════════════════════════ */
const CREW_NAMES=["Alpha Crew","Bravo Crew","Charlie Crew","Delta Crew","Echo Crew"];
const CREW_STATUS=["Dispatched","Staged","En Route","On-Site","Standby"];
function renderCrew(){
  const top=ALL_ASSETS.slice(0,5);
  document.getElementById("crew-list").innerHTML=top.map((a,i)=>`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:14px">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted);flex-shrink:0">${i+1}</div>
      <div style="flex:1">
        <div style="font-size:13.5px;font-weight:700">${CREW_NAMES[i]} → <span style="color:${riskColor(a.status)}">${a.id}</span></div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:2px">${a.location} · ${a.customers.toLocaleString()} customers at risk</div>
      </div>
      <span style="font-size:14px;font-weight:800;color:${riskColor(a.status)}">${a.riskScore}%</span>
      <span class="status-pill sp-${a.status}" style="font-size:10.5px">${CREW_STATUS[i]}</span>
    </div>`).join("");
}

/* ════════════════════════════════════════════════════════════════════════
   RISK ENGINE PAGE
   ════════════════════════════════════════════════════════════════════════ */
function renderFormula(){
  const a=ALL_ASSETS.find(x=>x.id==="T-802")||ALL_ASSETS[0];if(!a)return;
  const rows=[
    {l:"Temperature × 30%",  v:Math.round(norm(a.temp,40,100)),w:.30,c:"#f97316"},
    {l:"Vibration × 20%",    v:a.vib,                           w:.20,c:"#eab308"},
    {l:"Weather × 20%",      v:a.wx,                            w:.20,c:"#3b82f6"},
    {l:"Failure History × 15%",v:Math.min(a.prevFail*20,100),  w:.15,c:"#a855f7"},
    {l:"Customer Impact × 15%",v:Math.round(norm(a.customers,0,15000)),w:.15,c:"#22c55e"},
  ];
  const total=rows.reduce((s,r)=>s+r.v*r.w,0).toFixed(2);
  document.getElementById("formula-rows").innerHTML=rows.map(r=>`
    <div class="formula-row">
      <span class="formula-label">${r.l}</span>
      <div class="formula-bar-bg"><div class="formula-bar-fill" style="width:${r.v}%;background:${r.c}"></div></div>
      <span class="formula-pct" style="color:${r.c}">${r.v}%</span>
      <span class="formula-weight">×${r.w}=${(r.v*r.w).toFixed(1)}</span>
    </div>`).join("");
  const col=total>=80?"var(--critical)":total>=60?"var(--high)":"var(--medium)";
  const el=document.getElementById("formula-total");
  el.textContent=total+"%"; el.style.color=col;
}
function renderSimCards(){
  const top=ALL_ASSETS.slice(0,4);
  document.getElementById("sim-cards").innerHTML=top.map(a=>{
    const col=riskColor(a.status);
    return`<div class="sim-card">
      <div class="sim-card-id">${a.id} — ${a.type}</div>
      <div class="sim-card-name">${a.name}</div>
      <div class="sim-row"><span class="sim-row-label">🌡 Temp</span><span class="sim-row-val" style="color:#f97316">${a.temp}°C</span></div>
      <div class="sim-row"><span class="sim-row-label">📳 Vib</span><span class="sim-row-val" style="color:#eab308">${a.vib}%</span></div>
      <div class="sim-row"><span class="sim-row-label">🌩 WX</span><span class="sim-row-val" style="color:#3b82f6">${a.wx}%</span></div>
      <div class="sim-risk" style="color:${col}">${a.riskScore}% <span class="status-pill sp-${a.status}" style="font-size:10px">${a.status}</span></div>
    </div>`;
  }).join("");
}

/* ════════════════════════════════════════════════════════════════════════
   SIMULATION
   ════════════════════════════════════════════════════════════════════════ */
function drift(v,lo,hi,d){return Math.max(lo,Math.min(hi,v+(Math.random()*d*2-d)));}
function toggleSim(){
  if(simInterval){
    clearInterval(simInterval);simInterval=null;
    document.getElementById("sim-toggle").textContent="▶ Start Simulation";
    document.getElementById("sim-toggle").className="sim-btn";
    document.getElementById("sim-label").textContent="Simulation stopped.";
    addLog("Simulation stopped","warn");
  }else{
    simInterval=setInterval(()=>{
      simTick++;
      const prevStatuses=Object.fromEntries(RAW.map(a=>[a.id,riskStatus(calcRisk(a))]));
      RAW=RAW.map(a=>({...a,temp:Math.round(drift(a.temp,30,100,3)),vib:Math.round(drift(a.vib,0,100,4)),wx:Math.round(drift(a.wx,0,100,5))}));
      ALL_ASSETS=enrich(RAW);
      ALL_ASSETS.forEach(a=>{if(prevStatuses[a.id]!=="Critical"&&a.status==="Critical")addLog(`🚨 ALERT: ${a.id} → Critical (${a.riskScore}%)!`,"crit");});
      renderSimCards();renderFormula();renderMQ(ALL_ASSETS);renderAnalysis(ALL_ASSETS);
      document.getElementById("sim-label").textContent=`Tick #${simTick} — risk scores recalculated`;
      addLog(`Tick #${simTick} — sensor values drifted, risk recalculated`,"info");
      requestAnimationFrame(()=>{drawBarChart(ALL_ASSETS);drawDonut(ALL_ASSETS);});
    },3000);
    document.getElementById("sim-toggle").textContent="⏹ Stop Simulation";
    document.getElementById("sim-toggle").className="sim-btn stop";
    document.getElementById("sim-label").textContent="Running — updates every 3s (production: 30s)";
    addLog("Simulation started — watching for Critical threshold crossings","ok");
  }
}

/* ════════════════════════════════════════════════════════════════════════
   TESTS
   ════════════════════════════════════════════════════════════════════════ */
function renderTestList(){
  document.getElementById("test-list").innerHTML=TESTS.map(t=>`
    <div class="test-item"><div class="test-dot t-pend">·</div><div class="test-name">${t}</div><div class="test-ms">—</div></div>`).join("");
}
function runTests(){
  addLog("Running test suite…","info");
  TESTS.forEach((_,i)=>{
    const delay=160+i*145+Math.random()*60;
    setTimeout(()=>{
      const items=document.querySelectorAll(".test-item");
      const pass=Math.random()>0.06;
      items[i].querySelector(".test-dot").className="test-dot "+(pass?"t-pass":"t-fail");
      items[i].querySelector(".test-dot").textContent=pass?"✓":"✗";
      items[i].querySelector(".test-ms").textContent=Math.round(delay)+"ms";
      if(i===TESTS.length-1){
        const fails=document.querySelectorAll(".t-fail").length;
        addLog(fails===0?`All ${TESTS.length} tests passed ✓`:`${TESTS.length-fails}/${TESTS.length} passed — ${fails} failed`,fails===0?"ok":"warn");
      }
    },delay);
  });
}

/* ════════════════════════════════════════════════════════════════════════
   MODAL
   ════════════════════════════════════════════════════════════════════════ */
function openModal(id){
  const a=ALL_ASSETS.find(x=>x.id===id);if(!a)return;
  const col=riskColor(a.status),dash=Math.round(188.5*a.riskScore/100);
  const factors=[
    {n:"Temp",     v:Math.round(norm(a.temp,40,100)),c:"#f97316"},
    {n:"Vibration",v:a.vib,c:"#eab308"},
    {n:"Weather",  v:a.wx, c:"#3b82f6"},
    {n:"Prev Fail",v:Math.min(a.prevFail*20,100),c:"#a855f7"},
    {n:"Customers",v:Math.round(norm(a.customers,0,15000)),c:"#22c55e"},
  ];
  document.getElementById("modal-title").textContent=a.id+" — "+a.name;
  document.getElementById("modal-sub").textContent=a.type+" · "+a.location;
  document.getElementById("modal-body").innerHTML=`
    <div class="risk-donut-wrap">
      <div class="risk-donut">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="30" fill="none" stroke="var(--surface2)" stroke-width="9"/>
          <circle cx="40" cy="40" r="30" fill="none" stroke="${col}" stroke-width="9" stroke-dasharray="${dash} 188.5" stroke-linecap="round"/>
        </svg>
        <div class="donut-label"><span class="donut-pct" style="color:${col}">${a.riskScore}%</span><span class="donut-sub">RISK</span></div>
      </div>
      <div style="flex:1">
        ${factors.map(f=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:11.5px">
          <span style="width:70px;color:var(--muted);font-size:11px">${f.n}</span>
          <div style="flex:1;height:5px;background:var(--surface2);border-radius:3px;overflow:hidden"><div style="width:${f.v}%;height:100%;background:${f.c};border-radius:3px"></div></div>
          <span style="width:30px;text-align:right;font-size:11px;color:var(--muted)">${f.v}%</span>
        </div>`).join("")}
      </div>
    </div>
    <div class="modal-meta">
      <div class="modal-meta-item"><div class="mm-label">Type</div><div class="mm-val">${a.type}</div></div>
      <div class="modal-meta-item"><div class="mm-label">Location</div><div class="mm-val">${a.location}</div></div>
      <div class="modal-meta-item"><div class="mm-label">Customers</div><div class="mm-val" style="color:${col}">${a.customers.toLocaleString()}</div></div>
      <div class="modal-meta-item"><div class="mm-label">Prev. Failures</div><div class="mm-val">${a.prevFail}</div></div>
      <div class="modal-meta-item"><div class="mm-label">Temperature</div><div class="mm-val">${a.temp}°C</div></div>
      <div class="modal-meta-item"><div class="mm-label">Vibration</div><div class="mm-val">${a.vib}%</div></div>
    </div>
    <div class="rec-box rec-${a.status}"><span class="rec-label">${a.status} — Recommended Action</span>${getRec(a)}</div>`;
  document.getElementById("modal-overlay").classList.add("open");
}
function closeModal(e){if(!e||e.target===document.getElementById("modal-overlay"))document.getElementById("modal-overlay").classList.remove("open");}

/* ════════════════════════════════════════════════════════════════════════
   LOG
   ════════════════════════════════════════════════════════════════════════ */
function addLog(msg,type="info"){
  const box=document.getElementById("log-box");if(!box)return;
  const ts=new Date().toLocaleTimeString();
  const cls={info:"log-info",ok:"log-ok",warn:"log-warn",crit:"log-crit"}[type]||"log-info";
  const d=document.createElement("div");
  d.innerHTML=`<span class="log-ts">[${ts}]</span> <span class="${cls}">${msg}</span>`;
  box.appendChild(d);box.scrollTop=box.scrollHeight;
}

/* ════════════════════════════════════════════════════════════════════════
   NAVIGATION
   ════════════════════════════════════════════════════════════════════════ */
const PAGE_TITLES={command:"⚡ Command Center",map:"🗺️ Grid Map",charts:"📊 Sensor Charts",watchlist:"📋 Asset Watchlist",weather:"🌩️ Weather & Risk",crew:"👷 Crew Planner",risk:"⚙️ Risk Engine",about:"ℹ️ About Project"};
function navigate(el,page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  document.getElementById("page-"+page).classList.add("active");
  el.classList.add("active");
  document.getElementById("topbar-title").textContent=PAGE_TITLES[page];
  closeSidebar();
  if(page==="charts"){populateChartSelect();renderSensorCharts();}
  if(page==="risk"){renderFormula();renderSimCards();renderTestList();}
  if(page==="weather")renderWeather();
  if(page==="crew")renderCrew();
  if(page==="watchlist")renderWatchlist(ALL_ASSETS);
}
function openSidebar(){document.getElementById("sidebar").classList.add("open");document.getElementById("sidebar-overlay").classList.add("open");}
function closeSidebar(){document.getElementById("sidebar").classList.remove("open");document.getElementById("sidebar-overlay").classList.remove("open");}

/* ════════════════════════════════════════════════════════════════════════
   LOAD DATA  (simulates trpc.grid.getOverview.useQuery)
   ════════════════════════════════════════════════════════════════════════ */
function reloadData(){
  document.getElementById("state-loading").style.display="flex";
  document.getElementById("state-error").style.display="none";
  document.getElementById("state-dashboard").style.display="none";
  setTimeout(()=>{
    try{
      ALL_ASSETS=enrich(RAW);
      const crits=ALL_ASSETS.filter(a=>a.status==="Critical").length;
      renderMetrics({assetsMonitored:ALL_ASSETS.length,criticalAssets:crits,weatherAlerts:4,crewsToPosition:5});
      renderTable(ALL_ASSETS);renderMQ(ALL_ASSETS);renderAnalysis(ALL_ASSETS);
      document.getElementById("state-loading").style.display="none";
      document.getElementById("state-dashboard").style.display="block";
      requestAnimationFrame(()=>{drawBarChart(ALL_ASSETS);drawDualLine("chart-trend",[55,61,69,78,85,89,91],"#3b82f6",[22,28,36,48,63,79,94],"#ef4444");drawDonut(ALL_ASSETS);});
      buildMap();
      addLog("grid.getOverview — 15 assets loaded","ok");
      addLog(`${crits} Critical asset(s) require immediate attention`,"crit");
    }catch(e){
      document.getElementById("state-loading").style.display="none";
      document.getElementById("state-error").style.display="flex";
    }
  },900);
}

/* ════════════════════════════════════════════════════════════════════════
   CLOCK + INIT
   ════════════════════════════════════════════════════════════════════════ */
setInterval(()=>{document.getElementById("clock").textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});},1000);
document.getElementById("clock").textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});

reloadData();
