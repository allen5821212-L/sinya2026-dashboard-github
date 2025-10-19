let rawRows = [];
let filteredRows = [];
let anomalies = [];

// Final schema (editable inputs + growth + notes)
const KEYS = ["Category","Brand","Owner","YearSales_2025","YearGP_2025","SalesGrowth_2026%","GPGrowth_2026%","Notes"];

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function parseCSV(text){
  const lines = text.replace(/\r/g,'').split('\n').filter(l => l.trim().length>0);
  if(lines.length === 0) return [];
  const first = lines[0];
  let delim = ',';
  if(first.split('\t').length > first.split(',').length && first.includes('\t')) delim = '\t';
  if(first.split(';').length > first.split(',').length && first.includes(';')) delim = ';';

  const headers = first.split(delim).map(h=>h.trim());
  const out = [];
  for(let i=1;i<lines.length;i++){
    const row = splitRow(lines[i], delim);
    if(row.length === 1 && row[0].trim()==="") continue;
    const obj = {};
    headers.forEach((h,idx)=> obj[h] = row[idx] ?? "");
    out.push(obj);
  }
  return out;
}

function splitRow(line, delim){
  const res = [];
  let cur = "";
  let inQ = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(ch === '"'){
      if(inQ && line[i+1] === '"'){ cur += '"'; i++; }
      else inQ = !inQ;
    } else if(ch === delim && !inQ){
      res.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  res.push(cur);
  return res;
}

function toNumber(v){
  if(v === null || v === undefined) return 0;
  if(typeof v === "number") return v;
  const s = String(v).replace(/[, ]/g,"");
  const num = parseFloat(s);
  return isFinite(num) ? num : 0;
}

function fmtMoney(n){ return toNumber(n).toLocaleString(undefined, {maximumFractionDigits:0}); }
function fmtPct(n){ return (toNumber(n) * 100).toFixed(1) + "%"; }

function calcDerived(rows){
  const factor = parseFloat($("#scenarioSelect").value) || 1.0;
  return rows.map(r=>{
    const out = {};
    KEYS.forEach(k=> out[k] = r[k] ?? "");
    const sales2025 = toNumber(out["YearSales_2025"]);
    const gp2025 = toNumber(out["YearGP_2025"]);
    const sg = parseFloat(out["SalesGrowth_2026%"]) || 0;
    const gg = parseFloat(out["GPGrowth_2026%"]) || 0;
    const margin2025 = sales2025 === 0 ? 0 : gp2025 / sales2025;

    const sales2026 = sales2025 * (1 + sg) * factor;
    const gp2026 = gp2025 * (1 + gg) * factor;
    const margin2026 = sales2026 === 0 ? 0 : gp2026 / sales2026;

    out["GPMargin_2025"] = margin2025;
    out["Sales_2026"] = sales2026;
    out["GP_2026"] = gp2026;
    out["GPMargin_2026"] = margin2026;

    out["YearSales_2025"] = sales2025;
    out["YearGP_2025"] = gp2025;
    out["SalesGrowth_2026%"] = sg;
    out["GPGrowth_2026%"] = gg;
    return out;
  });
}

function computeKPIs(rows){
  let sales2025 = 0, gp2025 = 0, sales2026 = 0, gp2026 = 0;
  rows.forEach(r=>{
    sales2025 += r.YearSales_2025;
    gp2025 += r.YearGP_2025;
    sales2026 += r.Sales_2026;
    gp2026 += r.GP_2026;
  });
  $("#kpiSales2025").textContent = fmtMoney(sales2025);
  $("#kpiGP2025").textContent = fmtMoney(gp2025);
  $("#kpiSales2026").textContent = fmtMoney(sales2026);
  $("#kpiGP2026").textContent = fmtMoney(gp2026);
  $("#kpiGPMargin2026").textContent = sales2026 ? ((gp2026/sales2026)*100).toFixed(1)+"%" : "—";
  $("#kpiSalesYoY").textContent = sales2025 ? ((sales2026/sales2025-1)*100).toFixed(1)+"%" : "—";
  $("#kpiGPYoY").textContent = gp2025 ? ((gp2026/gp2025-1)*100).toFixed(1)+"%" : "—";
}

function renderTable(rows){
  const tbody = $("#dataTable tbody");
  tbody.innerHTML = "";
  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.Category||""}</td>
      <td>${r.Brand||""}</td>
      <td>${r.Owner||""}</td>
      <td class="num">${fmtMoney(r.YearSales_2025)}</td>
      <td class="num" style="${r.YearGP_2025<0?'color:#ff6b6b':''}">${fmtMoney(r.YearGP_2025)}</td>
      <td class="num">${(r["SalesGrowth_2026%"]*100).toFixed(1)}%</td>
      <td class="num">${(r["GPGrowth_2026%"]*100).toFixed(1)}%</td>
      <td>${r.Notes||""}</td>
      <td class="num">${fmtPct(r.GPMargin_2025)}</td>
      <td class="num">${fmtMoney(r.Sales_2026)}</td>
      <td class="num">${fmtMoney(r.GP_2026)}</td>
      <td class="num">${fmtPct(r.GPMargin_2026)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function detectAnomalies(rows){
  anomalies = rows.filter(r=>
    (r.YearSales_2025===0 && r.YearGP_2025>0) ||
    (r.YearGP_2025<0) ||
    (r.GPMargin_2025>0.6) ||
    (r.GPMargin_2026>0.6)
  );
  const tbody = $("#anomTable tbody");
  tbody.innerHTML = "";
  anomalies.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.Category||""}</td>
      <td>${r.Brand||""}</td>
      <td>${r.Owner||""}</td>
      <td class="num">${fmtMoney(r.YearSales_2025)}</td>
      <td class="num" style="${r.YearGP_2025<0?'color:#ff6b6b':''}">${fmtMoney(r.YearGP_2025)}</td>
      <td class="num">${fmtPct(r.GPMargin_2025)}</td>
      <td class="num">${fmtMoney(r.Sales_2026)}</td>
      <td class="num">${fmtMoney(r.GP_2026)}</td>
      <td class="num">${fmtPct(r.GPMargin_2026)}</td>
      <td>${r.Notes||""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function searchFilter(term){
  term = term.trim().toLowerCase();
  if(!term){
    filteredRows = rawRows.slice();
    return;
  }
  filteredRows = rawRows.filter(r=>
    String(r.Category||"").toLowerCase().includes(term) ||
    String(r.Brand||"").toLowerCase().includes(term) ||
    String(r.Owner||"").toLowerCase().includes(term) ||
    String(r.Notes||"").toLowerCase().includes(term)
  );
}

function refresh(){
  const derived = calcDerived(filteredRows);
  computeKPIs(derived);
  renderTable(derived);
  detectAnomalies(derived);
}

let sortKey = null;
let sortAsc = true;
function sortBy(key){
  if(sortKey === key) sortAsc = !sortAsc; else { sortKey = key; sortAsc = true; }
  filteredRows.sort((a,b)=>{
    const va = a[key], vb = b[key];
    if(typeof va === "number" && typeof vb === "number"){
      return sortAsc ? va - vb : vb - va;
    }
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
  refresh();
}

function attachEvents(){
  $("#fileInput").addEventListener("change", e=>{
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(reader.result);
      rawRows = rows.map(r=>{
        const o = {};
        KEYS.forEach(k=> o[k] = r[k] ?? "");
        return o;
      });
      filteredRows = rawRows.slice();
      localStorage.setItem("sinya_v4_data", JSON.stringify(rawRows));
      refresh();
    };
    reader.readAsText(file, "utf-8");
  });

  $("#loadUrlBtn").addEventListener("click", async ()=>{
    const url = $("#sheetUrl").value.trim();
    if(!url) return alert("請貼上 Google Sheet 的 CSV 連結");
    try{
      const res = await fetch(url);
      const text = await res.text();
      const rows = parseCSV(text);
      rawRows = rows.map(r=>{
        const o = {};
        KEYS.forEach(k=> o[k] = r[k] ?? "");
        return o;
      });
      filteredRows = rawRows.slice();
      localStorage.setItem("sinya_v4_data_url", url);
      refresh();
    }catch(err){
      alert("載入失敗，請確認連結是否公開且為 CSV：\\n" + err.message);
    }
  });

  $("#scenarioSelect").addEventListener("change", refresh);
  $("#searchBox").addEventListener("input", e=>{ searchFilter(e.target.value); refresh(); });

  $$("#dataTable thead th").forEach(th=>{
    const key = th.dataset.key;
    if(!key) return;
    th.addEventListener("click", ()=> sortBy(key));
  });

  $("#downloadAnomsBtn").addEventListener("click", ()=>{
    const derived = calcDerived(filteredRows);
    const bad = derived.filter(r=>
      (r.YearSales_2025===0 && r.YearGP_2025>0) ||
      (r.YearGP_2025<0) ||
      (r.GPMargin_2025>0.6) ||
      (r.GPMargin_2026>0.6)
    );
    if(bad.length===0) return alert("目前沒有異常列。");
    const headers = ["Category","Brand","Owner","YearSales_2025","YearGP_2025","GPMargin_2025","Sales_2026","GP_2026","GPMargin_2026","Notes"];
    const lines = [headers.join(",")];
    bad.forEach(r=>{
      const line = [
        r.Category,r.Brand,r.Owner,
        r.YearSales_2025,r.YearGP_2025,r.GPMargin_2025,
        r.Sales_2026,r.GP_2026,r.GPMargin_2026,
        '"'+(r.Notes||"").replace(/"/g,'""')+'"'
      ].join(",");
      lines.push(line);
    });
    const blob = new Blob([lines.join("\\n")], {type:"text/csv;charset=utf-8;"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "anomalies_v4.csv";
    a.click();
  });
}

function loadFromLocal(){
  try{
    const raw = localStorage.getItem("sinya_v4_data");
    if(raw){
      rawRows = JSON.parse(raw);
      filteredRows = rawRows.slice();
    } else {
      fetch("sample_data.csv").then(r=>r.text()).then(text=>{
        const rows = parseCSV(text);
        rawRows = rows.map(r=>{
          const o = {};
          KEYS.forEach(k=> o[k] = r[k] ?? "");
          return o;
        });
        filteredRows = rawRows.slice();
        refresh();
      });
    }
  }catch(e){}
  refresh();
}

document.addEventListener("DOMContentLoaded", ()=>{
  attachEvents();
  loadFromLocal();
});
