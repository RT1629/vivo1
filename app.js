const STORAGE_KEY="experimentRecords_v3";
const PERSONS=["","渡邊周一","髙橋里津","臼井淳真","島田港","濱野稜太","高山佳大"];
let savedRecords=loadJSON(STORAGE_KEY,[]);
let session=createEmptySession();
let selectedCommon={water:"",food:"",bedding:""};
let currentMeasurementCage=0,currentDosingCage=0;
const $=id=>document.getElementById(id);

function animal(){return{color:"",infectionWeeks:"",measurer:"",recorder:"",isoMeasure:"",rightThickness:"",rightWidth:"",leftThickness:"",leftWidth:"",weight:"",measurementMemo:"",dosingPresence:"",isoDose:"",syringesUsed:"",syringesDiscarded:"",dosingPeriod:"",dosingSite:"",dosingDrug:"",drugConcentration:"",dosingMemo:""}}
function cage(){return{cageNumber:"",animals:[animal()]}}
function createEmptySession(){return{common:{date:"",expNo:"",water:"",food:"",bedding:"",memo:""},cages:[cage()]}}
function loadJSON(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}}
function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}
function intBlank(v){if(v==="")return"";const n=Number(v);return Number.isFinite(n)?String(Math.trunc(n)):""}
function dec2Blank(v){if(v==="")return"";const n=Number(v);return Number.isFinite(n)?n.toFixed(2):""}
function normalizeAnimal(a){["rightThickness","rightWidth","leftThickness","leftWidth","weight"].forEach(k=>a[k]=dec2Blank(a[k]));["isoMeasure","isoDose","syringesUsed","syringesDiscarded"].forEach(k=>a[k]=intBlank(a[k]))}
function showScreen(step){["stepCommon","stepMeasurement","stepDosing"].forEach(id=>$(id).classList.remove("active"));$(step===1?"stepCommon":step===2?"stepMeasurement":"stepDosing").classList.add("active");$("stepIndicator").textContent=`Step ${step} / 3`;window.scrollTo({top:0,behavior:"smooth"})}
function setupSegmented(container,onChange){container.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{container.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");onChange(btn.dataset.value)}))}
function syncSegmented(container,value){container.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===value))}
document.querySelectorAll(".segmented[data-group]").forEach(g=>setupSegmented(g,v=>selectedCommon[g.dataset.group]=v));
function captureCommon(){session.common={date:$("commonDate").value,expNo:$("commonExpNo").value.trim(),water:selectedCommon.water,food:selectedCommon.food,bedding:selectedCommon.bedding,memo:$("commonMemo").value.trim()}}

function personOptions(selected){
 return PERSONS.map((p,i)=>`<option value="${p}"${p===selected?" selected":""}>${i===0?"未選択":p}</option>`).join("");
}
function fillBlankSiblings(cageIndex,key,value,fromIndex){
 if(fromIndex!==0||!value)return;
 session.cages[cageIndex].animals.forEach((a,i)=>{if(i!==0&&!a[key])a[key]=value});
}

function renderMeasurement(){
 const c=session.cages[currentMeasurementCage];
 $("measurementCageProgress").textContent=`ケージ ${currentMeasurementCage+1} / ${session.cages.length}`;
 $("measurementCageNumber").value=c.cageNumber??"";
 const host=$("measurementAnimals");host.innerHTML="";
 c.animals.forEach((a,index)=>{
   const node=$("measurementAnimalTemplate").content.cloneNode(true);
   const root=node.querySelector(".animal-card");
   root.querySelector(".animal-title").textContent=`個体 ${index+1}`;
   root.querySelector(".m-color").value=a.color;
   root.querySelector(".m-weeks").value=a.infectionWeeks;
   root.querySelector(".m-measurer").innerHTML=personOptions(a.measurer);
   root.querySelector(".m-recorder").innerHTML=personOptions(a.recorder);
   root.querySelector(".m-iso-measure").value=a.isoMeasure;
   root.querySelector(".m-r-thick").value=a.rightThickness;
   root.querySelector(".m-r-width").value=a.rightWidth;
   root.querySelector(".m-l-thick").value=a.leftThickness;
   root.querySelector(".m-l-width").value=a.leftWidth;
   root.querySelector(".m-weight").value=a.weight;
   root.querySelector(".m-memo").value=a.measurementMemo;

   const bind=(sel,key,transform=v=>v)=>{
     const e=root.querySelector(sel);
     ["input","change"].forEach(evt=>e.addEventListener(evt,()=>{
       const old=a[key]; a[key]=transform(e.value);
       if((key==="measurer"||key==="recorder")&&index===0){
         fillBlankSiblings(currentMeasurementCage,key,a[key],index);
         renderMeasurement();
       }
     }));
   };
   bind(".m-color","color");bind(".m-weeks","infectionWeeks");
   bind(".m-measurer","measurer");bind(".m-recorder","recorder");
   bind(".m-iso-measure","isoMeasure",intBlank);
   bind(".m-r-thick","rightThickness");bind(".m-r-width","rightWidth");
   bind(".m-l-thick","leftThickness");bind(".m-l-width","leftWidth");
   bind(".m-weight","weight");bind(".m-memo","measurementMemo");

   root.querySelector(".remove-animal").addEventListener("click",()=>{
     if(c.animals.length===1){alert("このケージには最低1匹必要です。");return}
     if(confirm(`個体 ${index+1} を削除しますか？`)){c.animals.splice(index,1);renderMeasurement()}
   });
   host.appendChild(node);
 });
}
$("measurementCageNumber").addEventListener("input",()=>session.cages[currentMeasurementCage].cageNumber=$("measurementCageNumber").value);

function dosingFieldsHtml(a,index){
 return `<label>投与時イソフルラン量<div class="unit-input"><input type="number" inputmode="numeric" step="1" class="d-iso-dose"><span>µL</span></div></label>
 <div class="grid2">
 <label>使用シリンジ数<div class="unit-input"><input type="number" inputmode="numeric" step="1" class="d-syr-used"><span>本</span></div></label>
 <label>廃棄シリンジ数<div class="unit-input"><input type="number" inputmode="numeric" step="1" class="d-syr-discarded"><span>本</span></div></label>
 </div>
 <label>投与期間<select class="d-period"><option value="">未選択</option><option>投与中</option><option>感染のみ</option><option>投与開始</option><option>終了</option></select></label>
 <label>投与部位<select class="d-site"><option value="">未選択</option><option>皮下</option><option>感染部位</option></select></label>
 <label>投与薬剤<select class="d-drug"><option value="">未選択</option><option>OnA</option><option>AmB</option></select></label>
 <label>薬剤濃度<div class="unit-input"><input type="number" inputmode="decimal" step="any" class="d-conc"><span>µg/kg</span></div></label>`;
}

function renderDosing(){
 const c=session.cages[currentDosingCage];
 $("dosingCageProgress").textContent=`ケージ ${currentDosingCage+1} / ${session.cages.length}`;
 $("dosingCageSummary").textContent=`ケージ番号：${c.cageNumber||"未入力"}｜${c.animals.length}匹`;
 const host=$("dosingAnimals");host.innerHTML="";
 c.animals.forEach((a,index)=>{
   const node=$("dosingAnimalTemplate").content.cloneNode(true);
   const root=node.querySelector(".animal-card");
   root.querySelector(".animal-title").textContent=`個体 ${index+1}`;
   root.querySelector(".mini-summary").textContent=`${a.color||"色未選択"}｜感染週数 ${a.infectionWeeks||"未入力"}｜測定者 ${a.measurer||"未選択"}｜記録者 ${a.recorder||"未選択"}`;
   const presence=root.querySelector(".dosing-presence");
   setupSegmented(presence,v=>{
     a.dosingPresence=v;
     if(v==="なし")["isoDose","syringesUsed","syringesDiscarded","dosingPeriod","dosingSite","dosingDrug","drugConcentration"].forEach(k=>a[k]="");
     renderDosing();
   });
   syncSegmented(presence,a.dosingPresence);
   const fields=root.querySelector(".dosing-fields");
   if(a.dosingPresence==="あり"){
     fields.innerHTML=dosingFieldsHtml(a,index);
     const bindings=[[".d-iso-dose","isoDose",intBlank],[".d-syr-used","syringesUsed",intBlank],[".d-syr-discarded","syringesDiscarded",intBlank],[".d-period","dosingPeriod",v=>v],[".d-site","dosingSite",v=>v],[".d-drug","dosingDrug",v=>v],[".d-conc","drugConcentration",v=>v]];
     bindings.forEach(([sel,key,transform])=>{
       const e=fields.querySelector(sel);e.value=a[key]??"";
       ["input","change"].forEach(evt=>e.addEventListener(evt,()=>{
         a[key]=transform(e.value);
         if(key==="dosingSite"&&index===0){
           fillBlankSiblings(currentDosingCage,key,a[key],index);
           renderDosing();
         }
       }));
     });
   }
   const memo=root.querySelector(".d-memo");memo.value=a.dosingMemo;memo.addEventListener("input",()=>a.dosingMemo=memo.value);
   host.appendChild(node);
 });
}

$("toMeasurement").addEventListener("click",()=>{captureCommon();currentMeasurementCage=0;renderMeasurement();showScreen(2)});
$("backToCommon").addEventListener("click",()=>showScreen(1));
$("addCageMeasurement").addEventListener("click",()=>{session.cages.push(cage());currentMeasurementCage=session.cages.length-1;renderMeasurement()});
$("addAnimalMeasurement").addEventListener("click",()=>{
 const c=session.cages[currentMeasurementCage], a=animal();
 if(c.animals[0]){a.measurer=c.animals[0].measurer;a.recorder=c.animals[0].recorder}
 c.animals.push(a);renderMeasurement()
});
$("measurementPrevCage").addEventListener("click",()=>{if(currentMeasurementCage>0){session.cages[currentMeasurementCage].animals.forEach(normalizeAnimal);currentMeasurementCage--;renderMeasurement()}});
$("measurementNextCage").addEventListener("click",()=>{session.cages[currentMeasurementCage].animals.forEach(normalizeAnimal);if(currentMeasurementCage<session.cages.length-1){currentMeasurementCage++;renderMeasurement()}else{session.cages.push(cage());currentMeasurementCage++;renderMeasurement()}});
$("toDosing").addEventListener("click",()=>{session.cages.forEach(c=>c.animals.forEach(normalizeAnimal));currentDosingCage=0;renderDosing();showScreen(3)});
$("backToMeasurement").addEventListener("click",()=>{currentMeasurementCage=Math.min(currentDosingCage,session.cages.length-1);renderMeasurement();showScreen(2)});
$("dosingPrevCage").addEventListener("click",()=>{if(currentDosingCage>0){currentDosingCage--;renderDosing()}});
$("dosingNextCage").addEventListener("click",()=>{if(currentDosingCage<session.cages.length-1){currentDosingCage++;renderDosing()}});

function buildMemo(c,m,d){const p=[];if(c?.trim())p.push(`共通：${c.trim()}`);if(m?.trim())p.push(`計測：${m.trim()}`);if(d?.trim())p.push(`投与：${d.trim()}`);return p.join(" / ")}
$("saveDay").addEventListener("click",()=>{
 captureCommon();session.cages.forEach(c=>c.animals.forEach(normalizeAnimal));
 const rows=[];
 session.cages.forEach(c=>c.animals.forEach(a=>rows.push({
   id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,
   date:session.common.date,expNo:session.common.expNo,cage:c.cageNumber,color:a.color,
   water:session.common.water,food:session.common.food,bedding:session.common.bedding,
   infectionWeeks:a.infectionWeeks,rightThickness:a.rightThickness,rightWidth:a.rightWidth,leftThickness:a.leftThickness,leftWidth:a.leftWidth,weight:a.weight,
   isoMeasure:a.isoMeasure,isoDose:a.isoDose,syringesUsed:a.syringesUsed,syringesDiscarded:a.syringesDiscarded,
   dosingPeriod:a.dosingPeriod,dosingSite:a.dosingSite,dosingDrug:a.dosingDrug,drugConcentration:a.drugConcentration,
   measurer:a.measurer,recorder:a.recorder,memo:buildMemo(session.common.memo,a.measurementMemo,a.dosingMemo),dosingPresence:a.dosingPresence
 })));
 savedRecords.push(...rows);saveJSON(STORAGE_KEY,savedRecords);renderSavedTable();alert(`${rows.length}匹分を保存しました。`);
 session=createEmptySession();selectedCommon={water:"",food:"",bedding:""};$("commonExpNo").value="";$("commonMemo").value="";document.querySelectorAll(".segmented[data-group] button").forEach(b=>b.classList.remove("selected"));$("commonDate").valueAsDate=new Date();showScreen(1)
});

function renderSavedTable(){const t=$("savedTable");t.innerHTML="";[...savedRecords].reverse().forEach(r=>{const tr=document.createElement("tr");[r.date,r.expNo,r.cage,r.color,r.rightThickness,r.rightWidth,r.leftThickness,r.leftWidth,r.weight,r.dosingPresence].forEach(v=>{const td=document.createElement("td");td.textContent=v??"";tr.appendChild(td)});const td=document.createElement("td"),b=document.createElement("button");b.textContent="削除";b.className="small secondary";b.addEventListener("click",()=>{if(confirm("この1行を削除しますか？")){savedRecords=savedRecords.filter(x=>x.id!==r.id);saveJSON(STORAGE_KEY,savedRecords);renderSavedTable()}});td.appendChild(b);tr.appendChild(td);t.appendChild(tr)})}
function csvEscape(v){if(v===null||v===undefined||v==="")return"";return `"${String(v).replaceAll('"','""')}"`}
function exportCSV(){
 const header=["年月日","EXP No.","ケージ番号","色","水","餌","床敷き","感染週数","右足厚さ (mm)","右足幅 (mm)","左足厚さ (mm)","左足幅 (mm)","体重 (g)","計測時イソフルラン量 (µL)","投与時イソフルラン量 (µL)","使用シリンジ数 (本)","廃棄シリンジ数 (本)","投与期間","投与部位","投与薬剤","薬剤濃度 (µg/kg)","測定者","計測記録者","備考"];
 const lines=[header.map(csvEscape).join(",")];
 savedRecords.forEach(r=>lines.push([r.date,r.expNo,r.cage,r.color,r.water,r.food,r.bedding,r.infectionWeeks,r.rightThickness,r.rightWidth,r.leftThickness,r.leftWidth,r.weight,r.isoMeasure,r.isoDose,r.syringesUsed,r.syringesDiscarded,r.dosingPeriod,r.dosingSite,r.dosingDrug,r.drugConcentration,r.measurer,r.recorder,r.memo].map(csvEscape).join(",")));
 downloadBlob("\uFEFF"+lines.join("\r\n"),"experiment_data.csv","text/csv;charset=utf-8")
}
function exportBackup(){downloadBlob(JSON.stringify({app:"experiment-data-v3",version:3,exportedAt:new Date().toISOString(),records:savedRecords},null,2),"experiment_backup.json","application/json")}
async function importBackup(e){const f=e.target.files?.[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.records))throw 0;if(confirm(`バックアップから${d.records.length}件を読み込みます。現在の保存データは置き換わります。`)){savedRecords=d.records;saveJSON(STORAGE_KEY,savedRecords);renderSavedTable();alert("バックアップを読み込みました。")}}catch{alert("バックアップを読み込めませんでした。")}e.target.value=""}
function downloadBlob(c,n,t){const b=new Blob([c],{type:t}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
$("csvButton").addEventListener("click",exportCSV);$("backupButton").addEventListener("click",exportBackup);$("restoreInput").addEventListener("change",importBackup);
$("commonDate").valueAsDate=new Date();renderSavedTable();
