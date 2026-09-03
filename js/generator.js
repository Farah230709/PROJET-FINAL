const criteriaForm=document.getElementById('criteriaForm');
const occasionSelect=document.getElementById('occasionSelect');
const weatherSelect=document.getElementById('weatherSelect');
const moodSelect=document.getElementById('moodSelect');
const styleChipsContainer=document.getElementById('generatorStyleChips');
const moodboard=document.getElementById('moodboard');
const notEnoughItems=document.getElementById('notEnoughItems');
const resultActions=document.getElementById('resultActions');
const regenerateBtn=document.getElementById('regenerateBtn');
const saveOutfitBtn=document.getElementById('saveOutfitBtn');
const shareOutfitBtn=document.getElementById('shareOutfitBtn');
const savedOutfitsGrid=document.getElementById('savedOutfitsGrid');
const OCCASION_LABELS={
    quotidien:'une journée tranquille',
    travail:'une journée de travail',
    soiree:'une soirée',
    sport:'une séance de sport'
};
const WEATHER_LABELS={
    auto:'la météo du jour',
    chaud:'temps chaud',
    froid:'temps froid',
    pluie:'la pluie'
};
const MOOD_LABELS={
    energique:'pleine d\'énergie',
    calme:'détendue',
    romantique:'romantique',
    confiante:'confiante',
    creative:'créative'
};
const STYLE_LABELS={
    casual:'Casual',
    chic:'Chic',
    streetwear:'Streetwear',
    sport:'Sportif'
};
const SEASON_BY_WEATHER={
    chaud:'ete',
    froid:'hiver',
    pluie:'mi-saison'
};
let selectedStyle=null;
let lastCriteria=null;
let lastOutfit=null;
function getUser(){
    return localStorage.getItem('currentUser')||'guest'
}
function loadDressing(){
    const raw=localStorage.getItem(`dressing_${getUser()}`);
    return raw?JSON.parse(raw):[]
}
function loadSavedOutfits(){const raw=localStorage.getItem(`tenuesSauvegardees_${getUser()}`);return raw?JSON.parse(raw):[]}
function saveSavedOutfits(list){localStorage.setItem(`tenuesSauvegardees_${getUser()}`,JSON.stringify(list))}
function loadShared(){const raw=localStorage.getItem(`mesPublications_${getUser()}`);return raw?JSON.parse(raw):[]}
function saveShared(list){localStorage.setItem(`mesPublications_${getUser()}`,JSON.stringify(list))}
function randomPick(array){return array[Math.floor(Math.random()*array.length)]}
function outfitToIds(outfit){
  const ids={hautId:outfit.haut.id,basId:outfit.bas.id,chaussuresId:outfit.chaussures.id};
  if(outfit.accessoire)ids.accessoireId=outfit.accessoire.id;
  return ids;
}
function resolveDressingItem(id){
  return loadDressing().find(i=>i.id===id)||null;
}
function loadImageElement(src){
  return new Promise((resolve)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=src;
  });
}
async function buildOutfitCollage(outfit){
  const pieces=[outfit.haut,outfit.bas,outfit.chaussures,outfit.accessoire].filter(Boolean);
  const loadedImages=await Promise.all(pieces.map(p=>loadImageElement(p.image)));
  const canvas=document.createElement('canvas');
  canvas.width=400;
  canvas.height=500;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#F1E9E0';
  ctx.fillRect(0,0,400,500);
  const cellW=200;
  const cellH=250;
  loadedImages.forEach((img,index)=>{
    if(!img)return;
    const x=(index%2)*cellW;
    const y=Math.floor(index/2)*cellH;
    const scale=Math.max(cellW/img.width,cellH/img.height);
    const drawW=img.width*scale;
    const drawH=img.height*scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x,y,cellW,cellH);
    ctx.clip();
    ctx.drawImage(img,x+(cellW-drawW)/2,y+(cellH-drawH)/2,drawW,drawH);
    ctx.restore();
  });
  return canvas.toDataURL('image/jpeg',0.75);
}
function filterBySeason(items,weather){
  const season=SEASON_BY_WEATHER[weather];
  if(!season)return items;
  return items.filter(i=>!i.seasons||i.seasons.length===0||i.seasons.includes(season));
}
function generateOutfit(criteria){
  const dressing=loadDressing();
  const filtered=filterBySeason(dressing,criteria.weather);
  const hauts=filtered.filter(i=>i.category==='haut');
  const bas=filtered.filter(i=>i.category==='bas');
  const chaussures=filtered.filter(i=>i.category==='chaussures');
  const accessoires=filtered.filter(i=>i.category==='accessoire');
  if(!hauts.length||!bas.length||!chaussures.length)return null;
  const outfit={haut:randomPick(hauts),bas:randomPick(bas),chaussures:randomPick(chaussures)};
  if(accessoires.length&&Math.random()>0.4)outfit.accessoire=randomPick(accessoires);
  return outfit;
}
function buildDescription(criteria,outfit){
  const styleLabel=criteria.style?STYLE_LABELS[criteria.style].toLowerCase():'à ton style';
  const moodPart=criteria.mood?`, d'humeur ${MOOD_LABELS[criteria.mood]}`:'';
  const accessoirePart=outfit.accessoire?`, complétée par ${outfit.accessoire.name.toLowerCase()}`:'';
  return `Pour ${OCCASION_LABELS[criteria.occasion]} par ${WEATHER_LABELS[criteria.weather]}${moodPart}, voici une tenue adaptée ${styleLabel} composée de ton ${outfit.haut.name.toLowerCase()}, ${outfit.bas.name.toLowerCase()} et ${outfit.chaussures.name.toLowerCase()}${accessoirePart}.`;
}
function renderPiece(item,label){
  return `<div class="moodboard__piece"><img src="${item.image}" alt="${item.name}"><span class="moodboard__piece-label">${label}</span></div>`;
}
function renderOutfit(criteria,outfit){
  moodboard.innerHTML=`
    <div class="moodboard__tags">
      <span class="moodboard__tag">${OCCASION_LABELS[criteria.occasion]}</span>
      <span class="moodboard__tag">${WEATHER_LABELS[criteria.weather]}</span>
      ${criteria.style?`<span class="moodboard__tag">${STYLE_LABELS[criteria.style]}</span>`:''}
      ${criteria.mood?`<span class="moodboard__tag">${MOOD_LABELS[criteria.mood]}</span>`:''}
    </div>
    <div class="moodboard__pieces">
      ${renderPiece(outfit.haut,'Haut')}
      ${renderPiece(outfit.bas,'Bas')}
      ${renderPiece(outfit.chaussures,'Chaussures')}
      ${outfit.accessoire?renderPiece(outfit.accessoire,'Accessoire'):''}
    </div>
    <p class="moodboard__description">${buildDescription(criteria,outfit)}</p>
  `;
}
function resetResultActions(){
  saveOutfitBtn.textContent='Enregistrer';
  saveOutfitBtn.disabled=false;
  shareOutfitBtn.textContent='Partager sur le feed';
  shareOutfitBtn.disabled=false;
}
function handleGenerate(criteria){
  const outfit=generateOutfit(criteria);
  if(!outfit){
    moodboard.innerHTML='';
    resultActions.hidden=true;
    notEnoughItems.hidden=false;
    lastOutfit=null;
    return;
  }
  notEnoughItems.hidden=true;
  resultActions.hidden=false;
  resetResultActions();
  lastCriteria=criteria;
  lastOutfit=outfit;
  renderOutfit(criteria,outfit);
}
function handleFormSubmit(event){
  event.preventDefault();
  const criteria={occasion:occasionSelect.value,weather:weatherSelect.value,style:selectedStyle,mood:moodSelect.value||null};
  handleGenerate(criteria);
}
function handleRegenerate(){
  if(!lastCriteria)return;
  handleGenerate(lastCriteria);
}
function handleStyleChipClick(event){
  const clicked=event.target.closest('.chip');
  if(!clicked)return;
  const alreadyActive=clicked.classList.contains('is-active');
  styleChipsContainer.querySelectorAll('.chip').forEach(chip=>chip.classList.remove('is-active'));
  if(alreadyActive){selectedStyle=null}
  else{clicked.classList.add('is-active');selectedStyle=clicked.dataset.style}
}
function handleSaveOutfit(){
  if(!lastOutfit||!lastCriteria)return;
  try{
    const saved=loadSavedOutfits();
    saved.unshift({
      id:Date.now(),
      date:new Date().toISOString(),
      criteria:lastCriteria,
      pieceIds:outfitToIds(lastOutfit)
    });
    saveSavedOutfits(saved);
    renderSavedOutfits();
    saveOutfitBtn.textContent='Enregistré ✓';
    saveOutfitBtn.disabled=true;
  }catch(error){
    console.error('Erreur d\'enregistrement :',error);
    alert('Impossible d\'enregistrer : stockage plein. Supprime une tenue enregistrée ou une pièce du dressing.');
  }
}
async function handleShareOutfit(){
  if(!lastOutfit||!lastCriteria)return;
  shareOutfitBtn.disabled=true;
  shareOutfitBtn.textContent='Partage en cours...';
  try{
    const collageImage=await buildOutfitCollage(lastOutfit);
    const shared=loadShared();
    shared.unshift({
      id:Date.now(),
      date:new Date().toISOString(),
      criteria:lastCriteria,
      pieceIds:outfitToIds(lastOutfit),
      image:collageImage
    });
    saveShared(shared);
    shareOutfitBtn.textContent='Partagé ✓';
  }catch(error){
    console.error('Erreur de partage :',error);
    shareOutfitBtn.disabled=false;
    shareOutfitBtn.textContent='Partager sur le feed';
    alert('Impossible de partager : stockage plein. Supprime une tenue enregistrée ou une pièce du dressing.');
  }
}
function createSavedCard(saved){
  const card=document.createElement('article');
  card.className='saved-outfit';
  card.dataset.id=saved.id;
  let pieces;
  if(saved.pieceIds){
    const ids=saved.pieceIds;
    pieces=[resolveDressingItem(ids.hautId),resolveDressingItem(ids.basId),resolveDressingItem(ids.chaussuresId),ids.accessoireId?resolveDressingItem(ids.accessoireId):null].filter(Boolean);
  }else{
    pieces=[saved.outfit.haut,saved.outfit.bas,saved.outfit.chaussures,saved.outfit.accessoire].filter(Boolean);
  }
  card.innerHTML=`
    <div class="saved-outfit__thumbs">${pieces.map(p=>`<img src="${p.image}" alt="${p.name}">`).join('')}</div>
    <div class="saved-outfit__meta">
      <span class="saved-outfit__label">${OCCASION_LABELS[saved.criteria.occasion]}</span>
      <button class="saved-outfit__delete" type="button" aria-label="Supprimer">✕</button>
    </div>
  `;
  card.querySelector('.saved-outfit__delete').addEventListener('click',()=>deleteSavedOutfit(saved.id));
  return card;
}
function renderSavedOutfits(){
  const saved=loadSavedOutfits();
  savedOutfitsGrid.innerHTML='';
  saved.forEach(item=>savedOutfitsGrid.appendChild(createSavedCard(item)));
}
function deleteSavedOutfit(id){
  const saved=loadSavedOutfits().filter(item=>item.id!==id);
  saveSavedOutfits(saved);
  renderSavedOutfits();
}
document.addEventListener('DOMContentLoaded',()=>{
  renderSavedOutfits();
  criteriaForm.addEventListener('submit',handleFormSubmit);
  styleChipsContainer.addEventListener('click',handleStyleChipClick);
  regenerateBtn.addEventListener('click',handleRegenerate);
  saveOutfitBtn.addEventListener('click',handleSaveOutfit);
  shareOutfitBtn.addEventListener('click',handleShareOutfit);
});