const STORAGE_KEY="experimentRecords_v2", PEOPLE_KEY="experimentPeople_v1";
let savedRecords=loadJSON(STORAGE_KEY,[]), people=loadJSON(PEOPLE_KEY,[]);
let session=createEmptySession(), selectedCommon={water:"",food:"",bedding:""};
let currentMeasurementIndex=0,currentDosingIndex=0;
const $=id=>document.getElementById(id);

function createEmptyAnimal(){return{cage:"",color:"",infectionWeeks:"",measurer:"",recorder:"",isoMeasure:"",rightThickness:"",rightWidth:"",leftThickness:"",leftWidth:"",weight:"",measurementMemo:"",dosingPresence:"",isoDose:"",syringesUsed:"",syringesDiscarded:"",dosingPeriod:"",dosingSite:"",dosingDrug:"",drugConcentration:"",dosingMemo:""}}
function createEmptySession(){return{common:{date:"",expNo:"",water:"",food:"",bedding:"",memo:""},animals:[createEmptyAnimal()]}}
function loadJSON(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}}
function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}
function showScreen(step){["stepCommon","stepMeasurement","stepDosing"].forEach(id=>$(id).classList.remove("active"));$(step===1?"stepCommon":step===2?"stepMeasurement":"stepDosing").classList.add("active");$("stepIndicator").textContent=`Step ${step} / 3`;window.scrollTo({top:0,behavior:"smooth"})}
function setupSegmented(container,onChange){container.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{container.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");onChange(btn.dataset.value)}))}
function syncSegmented(container,value){container.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===value))}
document.querySelectorAll(".segmented[data-group]").forEach(g=>setupSegmented(g,v=>selectedCommon[g.dataset.group]=v));

function captureCommon(){session.common={date:$("commonDate").value,expNo:$("commonExpNo").value.trim(),water:selectedCommon.water,food:selectedCommon.food,bedding:selectedCommon.bedding,memo:$("commonMemo").value.trim()}}
function intBlank(v){if(v==="")return"";const n=Number(v);return Number.isFinite(n)?String(Math.trunc(n)):""}
function dec2Blank(v){if(v==="")return"";const n=Number(v);return Number.isFinite(n)?n.toFixed(2):""}
function normalizeMeasurement(a){["rightThickness","rightWidth","leftThickness","leftWidth","weight"].forEach(k=>a[k]=dec2Blank(a[k]));a.isoMeasure=intBlank(a.isoMeasure)}
function rememberPerson(v){const n=v.trim();if(n&&!people.includes(n)){people.push(n);people.sort((a,b)=>a.localeCompare(b,"ja"));saveJSON(PEOPLE_KEY,people);renderPeopleList()}}
function renderPeopleList(){const l=$("personNames");l.innerHTML="";people.forEach(n=>{const o=document.createElement("option");o.value=n;l.appendChild(o)})}

function renderMeasurement(){
 const a=session.animals[currentMeasurementIndex], host=$("measurementForm");host.innerHTML="";
 host.appendChild($("measurementTemplate").content.cloneNode(true));
 $("measurementProgress").textContent=`個体 ${currentMeasurementIndex+1} / ${session.animals.length}`;
 const root=host.querySelector(".animal-card");root.querySelector(".animal-title").textContent=`個体 ${currentMeasurementIndex+1}`;
 const map={".m-cage":"cage",".m-color":"color",".m-weeks":"infectionWeeks",".m-measurer":"measurer",".m-recorder":"recorder",".m-iso-measure":"isoMeasure",".m-r-thick":"rightThickness",".m-r-width":"rightWidth",".m-l-thick":"leftThickness",".m-l-width":"leftWidth",".m-weight":"weight",".m-memo":"measurementMemo"};
 Object.entries(map).forEach(([s,k])=>{const e=root.querySelector(s);e.value=a[k]??"";e.addEventListener("input",()=>{a[k]=k==="isoMeasure"?intBlank(e.value):e.value;if(k==="measurer"||k==="recorder")rememberPerson(e.value)})});
 root.querySelector(".remove-animal").addEventListener("click",()=>{if(session.animals.length===1){alert("個体は最低1匹必要です。");return}if(!confirm(`個体 ${currentMeasurementIndex+1} を削除しますか？`))return;session.animals.splice(currentMeasurementIndex,1);currentMeasurementIndex=Math.min(currentMeasurementIndex,session.animals.length-1);renderMeasurement()})
}

function renderDosing(){
 const a=session.animals[currentDosingIndex];
 $("dosingProgress").textContent=`個体 ${currentDosingIndex+1} / ${session.animals.length}`;
 $("dosingAnimalSummary").textContent=`個体 ${currentDosingIndex+1}｜${a.color||"色未選択"}｜${a.cage?`ケージ ${a.cage}`:"ケージ未入力"}`;
 syncSegmented($("dosingPresence"),a.dosingPresence);$("dosingMemo").value=a.dosingMemo||"";
 const h=$("dosingFields");h.innerHTML="";
 if(a.dosingPresence!=="あり")return;
 h.innerHTML=`<label>投与時イソフルラン量<div class="unit-input"><input type="number" inputmode="numeric" step="1" id="d-iso-dose"><span>µL</span></div></label>
 <div class="grid2"><label>使用シリンジ数<div class="unit-input"><input type="number" inputmode="numeric" step="1" id="d-syr-used"><span>本</span></div></label><label>廃棄シリンジ数<div class="unit-input"><input type="number" inputmode="numeric" step="1" id="d-syr-discarded"><span>本</span></div></label></div>
 <label>投与期間<select id="d-period"><option value="">未選択</option><option>投与中</option><option>感染のみ</option><option>投与開始</option><option>終了</option></select></label>
 <label>投与部位<select id="d-site"><option value="">未選択</option><option>皮下</option><option>感染部位</option></select></label>
 <label>投与薬剤<select id="d-drug"><option value="">未選択</option><option>OnA</option><option>AmB</option></select></label>
 <label>薬剤濃度<div class="unit-input"><input type="number" inputmode="decimal" step="any" id="d-conc"><span>µg/kg</span></div></label>`;
 [["d-iso-dose","isoDose",1],["d-syr-used","syringesUsed",1],["d-syr-discarded","syringesDiscarded",1],["d-period","dosingPeriod",0],["d-site","dosingSite",0],["d-drug","dosingDrug",0],["d-conc","drugConcentration",0]].forEach(([id,k,i])=>{const e=$(id);e.value=a[k]??"";["input","change"].forEach(evt=>e.addEventListener(evt,()=>a[k]=i?intBlank(e.value):e.value))})
}
setupSegmented($("dosingPresence"),v=>{const a=session.animals[currentDosingIndex];a.dosingPresence=v;if(v==="なし"){["isoDose","syringesUsed","syringesDiscarded","dosingPeriod","dosingSite","dosingDrug","drugConcentration"].forEach(k=>a[k]="")}renderDosing()});
$("dosingMemo").addEventListener("input",()=>session.animals[currentDosingIndex].dosingMemo=$("dosingMemo").value);

$("toMeasurement").addEventListener("click",()=>{captureCommon();currentMeasurementIndex=0;renderMeasurement();showScreen(2)});
$("backToCommon").addEventListener("click",()=>showScreen(1));
$("addAnimalMeasurement").addEventListener("click",()=>{session.animals.push(createEmptyAnimal());currentMeasurementIndex=session.animals.length-1;renderMeasurement()});
$("measurementPrev").addEventListener("click",()=>{if(currentMeasurementIndex>0){normalizeMeasurement(session.animals[currentMeasurementIndex]);currentMeasurementIndex--;renderMeasurement()}});
$("measurementNext").addEventListener("click",()=>{normalizeMeasurement(session.animals[currentMeasurementIndex]);if(currentMeasurementIndex<session.animals.length-1)currentMeasurementIndex++;else{session.animals.push(createEmptyAnimal());currentMeasurementIndex++}renderMeasurement()});
$("toDosing").addEventListener("click",()=>{session.animals.forEach(normalizeMeasurement);currentDosingIndex=0;renderDosing();showScreen(3)});
$("backToMeasurement").addEventListener("click",()=>{currentMeasurementIndex=Math.min(currentDosingIndex,session.animals.length-1);renderMeasurement();showScreen(2)});
$("dosingPrev").addEventListener("click",()=>{session.animals[currentDosingIndex].dosingMemo=$("dosingMemo").value;if(currentDosingIndex>0){currentDosingIndex--;renderDosing()}});
$("dosingNext").addEventListener("click",()=>{session.animals[currentDosingIndex].dosingMemo=$("dosingMemo").value;if(currentDosingIndex<session.animals.length-1){currentDosingIndex++;renderDosing()}});

function buildMemo(c,m,d){const p=[];if(c?.trim())p.push(`共通：${c.trim()}`);if(m?.trim())p.push(`計測：${m.trim()}`);if(d?.trim())p.push(`投与：${d.trim()}`);return p.join(" / ")}
$("saveDay").addEventListener("click",()=>{session.animals[currentDosingIndex].dosingMemo=$("dosingMemo").value;captureCommon();session.animals.forEach(normalizeMeasurement);
 const rows=session.animals.map(a=>({id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,date:session.common.date,expNo:session.common.expNo,cage:a.cage,color:a.color,water:session.common.water,food:session.common.food,bedding:session.common.bedding,infectionWeeks:a.infectionWeeks,rightThickness:a.rightThickness,rightWidth:a.rightWidth,leftThickness:a.leftThickness,leftWidth:a.leftWidth,weight:a.weight,isoMeasure:intBlank(a.isoMeasure),isoDose:intBlank(a.isoDose),syringesUsed:intBlank(a.syringesUsed),syringesDiscarded:intBlank(a.syringesDiscarded),dosingPeriod:a.dosingPeriod,dosingSite:a.dosingSite,dosingDrug:a.dosingDrug,drugConcentration:a.drugConcentration,measurer:a.measurer,recorder:a.recorder,memo:buildMemo(session.common.memo,a.measurementMemo,a.dosingMemo),dosingPresence:a.dosingPresence}));
 savedRecords.push(...rows);saveJSON(STORAGE_KEY,savedRecords);renderSavedTable();alert(`${rows.length}匹分を保存しました。`);
 session=createEmptySession();selectedCommon={water:"",food:"",bedding:""};$("commonExpNo").value="";$("commonMemo").value="";document.querySelectorAll(".segmented[data-group] button").forEach(b=>b.classList.remove("selected"));$("commonDate").valueAsDate=new Date();showScreen(1)
});

function renderSavedTable(){const t=$("savedTable");t.innerHTML="";[...savedRecords].reverse().forEach(r=>{const tr=document.createElement("tr");[r.date,r.expNo,r.cage,r.color,r.rightThickness,r.rightWidth,r.leftThickness,r.leftWidth,r.weight,r.dosingPresence].forEach(v=>{const td=document.createElement("td");td.textContent=v??"";tr.appendChild(td)});const td=document.createElement("td"),b=document.createElement("button");b.textContent="削除";b.className="small secondary";b.addEventListener("click",()=>{if(confirm("この1行を削除しますか？")){savedRecords=savedRecords.filter(x=>x.id!==r.id);saveJSON(STORAGE_KEY,savedRecords);renderSavedTable()}});td.appendChild(b);tr.appendChild(td);t.appendChild(tr)})}
function csvEscape(v){if(v===null||v===undefined||v==="")return"";return `"${String(v).replaceAll('"','""')}"`}
function exportCSV(){const header=["年月日","EXP No.","ケージ番号","色","水","餌","床敷き","感染週数","右足厚さ (mm)","右足幅 (mm)","左足厚さ (mm)","左足幅 (mm)","体重 (g)","計測時イソフルラン量 (µL)","投与時イソフルラン量 (µL)","使用シリンジ数 (本)","廃棄シリンジ数 (本)","投与期間","投与部位","投与薬剤","薬剤濃度 (µg/kg)","測定者","計測記録者","備考"];const lines=[header.map(csvEscape).join(",")];savedRecords.forEach(r=>lines.push([r.date,r.expNo,r.cage,r.color,r.water,r.food,r.bedding,r.infectionWeeks,r.rightThickness,r.rightWidth,r.leftThickness,r.leftWidth,r.weight,r.isoMeasure,r.isoDose,r.syringesUsed,r.syringesDiscarded,r.dosingPeriod,r.dosingSite,r.dosingDrug,r.drugConcentration,r.measurer,r.recorder,r.memo].map(csvEscape).join(",")));downloadBlob("\uFEFF"+lines.join("\r\n"),"experiment_data.csv","text/csv;charset=utf-8")}
function exportBackup(){downloadBlob(JSON.stringify({app:"experiment-data-v2",version:2,exportedAt:new Date().toISOString(),records:savedRecords,people},null,2),"experiment_backup.json","application/json")}
async function importBackup(e){const f=e.target.files?.[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.records))throw 0;if(confirm(`バックアップから${d.records.length}件を読み込みます。現在の保存データは置き換わります。`)){savedRecords=d.records;people=Array.isArray(d.people)?d.people:[];saveJSON(STORAGE_KEY,savedRecords);saveJSON(PEOPLE_KEY,people);renderSavedTable();renderPeopleList();alert("バックアップを読み込みました。")}}catch{alert("バックアップを読み込めませんでした。")}e.target.value=""}
function downloadBlob(c,n,t){const b=new Blob([c],{type:t}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
$("csvButton").addEventListener("click",exportCSV);$("backupButton").addEventListener("click",exportBackup);$("restoreInput").addEventListener("change",importBackup);
$("commonDate").valueAsDate=new Date();renderPeopleList();renderSavedTable();syncSegmented($("dosingPresence"),"");