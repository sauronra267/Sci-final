const D=window.SCIWRITE_DATA;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEYS={done:"sciwrite-v4-done",notes:"sciwrite-v4-notes",last:"sciwrite-v4-last",book:"sciwrite-v4-bookmarks",practice:"sciwrite-v4-practice",quiz:"sciwrite-v4-quiz",theme:"sciwrite-v4-theme",streak:"sciwrite-v4-streak",watch:"sciwrite-v7-watch"};
let done=load(KEYS.done,{}),notes=load(KEYS.notes,{}),noteSizes=load("sciwrite-v4-note-sizes",{}),bookmarks=load(KEYS.book,{}),practice=load(KEYS.practice,{}),quiz=load(KEYS.quiz,{}),watchProgress=load(KEYS.watch,{}),current=null,version="new",reviewMode="full",toastTimer,ytPlayer=null,watchTimer=null;
const lessons=D.videos.filter(v=>v.module!=="extra"), lessonKeys=[...new Set(lessons.map(v=>v.module+"|"+v.lesson))];
const moduleEntries=Object.entries(D.modules).filter(([k])=>k!=="extra");
const moduleTitles=Object.fromEntries(moduleEntries);

function load(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}}
function persist(k,v){localStorage.setItem(k,JSON.stringify(v))}
function saveAll(){persist(KEYS.done,done);persist(KEYS.notes,notes);persist(KEYS.book,bookmarks);persist(KEYS.practice,practice);persist(KEYS.quiz,quiz);persist(KEYS.watch,watchProgress)}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200)}
function variants(key){return D.videos.filter(v=>v.module+"|"+v.lesson===key)}
function pct(m){const ks=lessonKeys.filter(k=>k.startsWith(m+"|"));return ks.length?Math.round(ks.filter(k=>done[k]).length/ks.length*100):0}
function watchedPct(k){return done[k]?100:Math.round(watchProgress[k]?.pct||0)}
function totalWatched(){return lessonKeys.filter(k=>(watchProgress[k]?.pct||0)>=90).length}
function overall(){return Math.round(lessonKeys.filter(k=>done[k]).length/lessonKeys.length*100)}
function nav(){
  const open=load("sciwrite-v7-open-modules",{});
  $("#moduleNav").innerHTML=moduleEntries.map(([k,n])=>{
    const arr=lessonKeys.filter(x=>x.startsWith(k+"|"));
    const expanded=open[k]!==false;
    return `<div class="unit-nav ${expanded?"expanded":""}" data-unit="${k}">
      <button class="unit-toggle" data-unit-toggle="${k}" aria-expanded="${expanded}"><span class="nav-icon">0${k}</span><span class="unit-name">${n}</span><span class="module-progress">${pct(k)}%</span><span class="unit-chevron">⌄</span></button>
      <div class="unit-lessons">${arr.map(x=>{const num=x.split("|")[1];return `<button class="lesson-nav-item ${current===x?"active":""}" data-lesson-nav="${x}"><span>${num}</span><span>${escape(titleFor(x))}</span><i style="width:${watchedPct(x)}%"></i></button>`}).join("")}</div>
    </div>`;
  }).join("");
  $$('[data-unit-toggle]').forEach(b=>b.onclick=()=>{const k=b.dataset.unitToggle;const state=load("sciwrite-v7-open-modules",{});state[k]=!(state[k]!==false);persist("sciwrite-v7-open-modules",state);nav()});
  $$('[data-lesson-nav]').forEach(b=>b.onclick=()=>{openLesson(b.dataset.lessonNav);closeSidebar()});
  $$('[data-view]').forEach(b=>b.onclick=()=>{const v=b.dataset.view;({home,review:reviewLab,workspace:researchWorkspace,reviewcenter:reviewCenter,resources,extras:extrasView,guide:siteGuide,bookmarks:bookmarkView,stats:statsView}[v]||home)();closeSidebar()});
}
function navActive(key){$$(`[data-view]`).forEach(b=>b.classList.toggle("active",b.dataset.view===key));$$(`[data-lesson-nav]`).forEach(b=>b.classList.toggle("active",b.dataset.lessonNav===key));$$(`[data-unit]`).forEach(u=>u.classList.toggle("current",key===u.dataset.unit))}
function closeSidebar(){$("#sidebar").classList.remove("open");$("#sidebarBackdrop")?.classList.remove("open")}
function openSidebar(){$("#sidebar").classList.add("open");$("#sidebarBackdrop")?.classList.add("open") }
function titleFor(k){const v=variants(k).find(x=>x.version==="new")||variants(k)[0];return v?.title?.replace(" — newer","").replace("Sainani ","")||k}
function lastKey(){return localStorage.getItem(KEYS.last)||lessonKeys[0]}
function countPractice(){return Object.entries(practice).filter(([k,x])=>k.startsWith("module-")&&String(x||"").trim()).length}
function countQuiz(){return Object.values(quiz).reduce((a,x)=>a+(x?.correct?1:0),0)}
function streak(){return Number(localStorage.getItem(KEYS.streak)||0)}
function updateStreak(){const today=new Date().toISOString().slice(0,10),last=localStorage.getItem("sciwrite-v4-day");if(last!==today){const prev=localStorage.getItem("sciwrite-v4-prevday");let s=Number(localStorage.getItem(KEYS.streak)||0);const y=new Date();y.setDate(y.getDate()-1);const yesterday=y.toISOString().slice(0,10);s=last===yesterday? s+1:1;localStorage.setItem(KEYS.streak,String(s));localStorage.setItem("sciwrite-v4-prevday",today);localStorage.setItem("sciwrite-v4-day",today)}}
updateStreak();

function home(){
  current=null; const p=overall(), last=lastKey(), v=variants(last)[0], currentTitle=titleFor(last);
  const nextIncomplete=lessonKeys.find(k=>!done[k])||last;
  $("#main").innerHTML=`<div class="content">
    <section class="hero">
      <div><div class="eyebrow">PERSONAL LEARNING PLATFORM</div><h1>Writing in the Sciences</h1><p>Study the course like an LMS: watch, read the lesson guide, answer questions, take rich notes, and build a real scientific-writing skill set.</p>
      <div class="hero-actions"><button class="primary" onclick="openLesson('${nextIncomplete}')">${p?`Continue learning →`:"Start course →"}</button></div></div>
      <div class="hero-stat"><div class="eyebrow" style="color:#dce6ff">COURSE PROGRESS</div><div class="stat-big">${p}%</div><div class="progress"><i style="width:${p}%"></i></div><div style="margin-top:12px;font-size:11px;color:#d8e2ff">${lessonKeys.filter(k=>done[k]).length} of ${lessonKeys.length} lessons completed</div></div>
    </section>
    <div class="continue"><div class="play-mini">▶</div><div class="continue-main"><span>CONTINUE WHERE YOU LEFT OFF</span><strong>${currentTitle}</strong><span>Module ${last.split("|")[0]} • Lesson ${last.split("|")[1]}</span></div><button class="primary" onclick="openLesson('${last}')">Resume</button></div>
    <div class="section-title"><h2>Your learning</h2><span>Saved locally on this device</span></div>
    <div class="kpi-grid">
      <div class="stat-card"><div class="label">LESSONS</div><div class="value">${lessonKeys.filter(k=>done[k]).length}/${lessonKeys.length}</div></div>
      <div class="stat-card"><div class="label">PRACTICE ENTRIES</div><div class="value">${countPractice()}</div></div>
      <div class="stat-card"><div class="label">QUIZ ANSWERS</div><div class="value">${countQuiz()}</div></div>
      <div class="stat-card"><div class="label">STUDY STREAK</div><div class="value">${streak()} day${streak()===1?"":"s"}</div></div>
    </div>
    <div class="section-title"><h2>Course modules</h2><span>8 units • original + newer videos</span></div>
    <div class="module-grid">${moduleEntries.map(([k,n])=>`<article class="module-card" onclick="showModule('${k}')"><div class="num">MODULE ${k}</div><h3>${n}</h3><p>${lessonKeys.filter(x=>x.startsWith(k+"|")).length} lessons • ${pct(k)}% complete</p><div class="mini-progress"><i style="width:${pct(k)}%"></i></div></article>`).join("")}</div>
    <div class="section-title"><h2>Study tools</h2><span>Built for active learning</span></div>
    <div class="resource-grid">
      <article class="resource-card" onclick="reviewCenter()"><div class="r-icon">↻</div><h3>Review Center</h3><p>Flashcards and targeted review for concepts that need another pass.</p></article>
      <article class="resource-card" onclick="researchWorkspace()"><div class="r-icon">✎</div><h3>My Research Workspace</h3><p>Build a real Abstract, Introduction, Methods, Results, and Discussion draft.</p></article>
    </div>
  </div>`;
  navActive("home");
}

function showModule(m){
  const arr=lessonKeys.filter(k=>k.startsWith(m+"|")), outcome=(D.outcomes&&D.outcomes[m])||[];
  $("#main").innerHTML=`<div class="content"><div class="eyebrow">MODULE ${m}</div><h1 style="margin:7px 0">${moduleTitles[m]}</h1>
  <p style="color:var(--muted);max-width:850px">Work through the lessons, read the lesson guide, answer the knowledge check, and mark each lesson complete when you can explain the main idea without looking back.</p>
  <div class="outcomes"><div class="eyebrow">LEARNING OBJECTIVES</div><ul>${outcome.map(x=>`<li>${x}</li>`).join("")}</ul></div>
  <div class="section-title"><h2>Lessons</h2><span>${arr.filter(k=>done[k]).length}/${arr.length} completed</span></div>
  <div class="module-grid">${arr.map(k=>{const vs=variants(k),v=vs.find(x=>x.version==="new")||vs[0], hasNew=vs.some(x=>x.version==="new");return `<article class="module-card" onclick="openLesson('${k}')"><div class="num">LESSON ${v.lesson} ${done[k]?"• ✓":""}</div><h3>${titleFor(k)}</h3><p>${hasNew?"Newer version available":"Video lesson"} • ${bookmarks[k]?"★ Bookmarked":"☆ Bookmark"}</p><div class="mini-progress"><i style="width:${watchedPct(k)}%"></i></div><small class="watch-label">${watchedPct(k)}% watched</small></article>`}).join("")}</div>
  <div class="section-title"><h2>Module practice</h2><span>Apply before moving on</span></div>${modulePractice(m)}
  </div>`;
  navActive(m);
}
function modulePractice(m){
 const prompts={1:"Rewrite a sentence from a paper you read this week by removing clutter without changing its scientific meaning.",2:"Find one sentence written in passive voice and rewrite it with a strong active verb where appropriate.",3:"Write one focused scientific paragraph. Make the first sentence state the main point and repeat key terms consistently.",4:"Describe how you would revise a rough paragraph: prewrite, draft, then perform at least two focused revision passes.",5:"Choose a paper and identify what its Introduction, Results, and Discussion each accomplish.",6:"Name one authorship, peer-review, plagiarism, or journal-selection pitfall and explain how you would avoid it.",7:"Write a 150-word abstract or outline for a grant, recommendation letter, review article, or personal statement.",8:"Explain one scientific finding twice: once for a specialist and once for an intelligent non-specialist."};
 const key="module-"+m;
 return `<div class="practice"><div class="eyebrow">PRACTICE TASK</div><h3>Apply Unit ${m}</h3><p style="color:var(--muted)">${prompts[m]}</p><textarea id="modulePractice" placeholder="Write your attempt here…">${escape(practice[key]||"")}</textarea><div class="lesson-actions"><button class="primary" onclick="saveModulePractice('${key}')">Save practice</button></div></div>`;
}
function saveModulePractice(key){practice[key]=$("#modulePractice").value;persist(KEYS.practice,practice);toast("Practice saved.");}

function openLesson(key){
 saveWatchPosition();stopWatchTimer();
 current=key;localStorage.setItem(KEYS.last,key);const vs=variants(key);version=vs.some(v=>v.version==="new")?"new":"old";renderLesson();
}
function renderLesson(){
 const vs=variants(current),v=vs.find(x=>x.version===version)||vs[0],idx=lessonKeys.indexOf(current),prev=lessonKeys[idx-1],next=lessonKeys[idx+1],thumb=`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
 const guide=(D.lessonGuides||{})[current]||{};
 const prevHtml=prev?`<button class="secondary" onclick="openLesson('${prev}')">← Previous</button>`:`<span></span>`, nextHtml=next?`<button class="primary" onclick="openLesson('${next}')">Next lesson →</button>`:`<button class="primary" onclick="statsView()">Finish course →</button>`;
 const wp=watchProgress[current]?.pct||0;
 const noteValue=notes[current]||"";
 const safeGuideTitle=escape(guide.title||titleFor(current));
 const guidePoints=(guide.keyPoints||[]).map(x=>`<li>${escape(x)}</li>`).join("");
 const q=escape(guide.question||'What is the main idea of this lesson, and how would you apply it to scientific writing?');
 const unitLink=(D.repo?.units||[]).find(u=>u.code===String(v.module).padStart(2,'0'))?.url||D.repo?.url;
 const oldNote = noteValue && !String(noteValue).trim().startsWith('<');
 const noteHtml=oldNote?escape(noteValue).replace(/\n/g,'<br>'):noteValue;
 $("#main").innerHTML=`<div class="content"><div class="lesson-layout"><section>
   <div class="video-shell"><div class="poster" id="poster" style="background-image:url('${thumb}')"><div class="play">▶</div></div><div id="player" class="yt-player" aria-label="YouTube video player"></div></div>
   <div class="watch-progress"><div class="watch-progress-top"><span>VIDEO WATCHED</span><b id="watchPercent">${wp}%</b></div><div class="watch-track"><i id="watchBar" style="width:${wp}%"></i></div><small>Progress is saved automatically on this device. Reaching 90% counts as watched.</small></div>
   <div class="video-fallback">If the embedded player is blocked, <a href="${v.url}" target="_blank" rel="noopener">open this lesson directly on YouTube ↗</a>.</div>
   <div class="eyebrow">MODULE ${v.module} • LESSON ${v.lesson}</div><h1 class="lesson-title">${safeGuideTitle}</h1><div class="lesson-meta">${v.version==="new"?"Newer video":"Original video"} • YouTube</div>
   <div class="version-row">${vs.map(x=>`<button class="pill ${x.version===version?"active":""}" onclick="setVersion('${x.version}')">${x.version==="new"?"Newer version":"Original version"}</button>`).join("")}<button class="pill ${bookmarks[current]?"active":""}" onclick="toggleBookmark()">★ ${bookmarks[current]?"Bookmarked":"Bookmark"}</button></div>
   <div class="lesson-actions"><button class="${done[current]?"secondary":"primary"}" onclick="toggleDone()">${done[current]?"✓ Completed — mark incomplete":"Mark as complete"}</button><a class="secondary" href="${v.url}" target="_blank" rel="noopener">Open on YouTube ↗</a></div>

   <article class="lesson-guide panel">
     <div class="guide-head"><div><div class="eyebrow">AFTER-VIDEO STUDY GUIDE</div><h2>${safeGuideTitle}</h2></div><a class="secondary guide-source" href="${unitLink||D.repo.url}" target="_blank" rel="noopener">Course archive ↗</a></div>
     <p class="guide-summary">${escape(guide.summary||'Use this short guide to consolidate the main idea after watching the video.')}</p>
     <div class="guide-grid"><div><h3>Key ideas</h3><ul>${guidePoints}</ul></div><div class="guide-note"><strong>Study move</strong><p>Close the video and explain the lesson in your own words before reading these points again.</p></div></div><div class="guide-disclaimer">Condensed study guide — not a verbatim transcript. Built from the archived course syllabus and public lecture index.</div>
   </article>

   <article class="ai-coach panel">
     <div class="eyebrow">AI ANSWER COACH</div><h2>Check your understanding</h2>
     <p class="muted">Answer the question without looking back. Then use AI to critique your answer against the lesson principle.</p>
     <div class="ai-question">${q}</div>
     <textarea id="aiAnswer" class="ai-answer" placeholder="Write your answer here…"></textarea>
     <div class="lesson-actions"><button class="primary" onclick="checkWithAI()">✦ Prepare AI check</button><button class="secondary" onclick="copyAIPrompt()">Copy prompt</button></div>
     <div class="ai-note">The SciWrite repository supplies the review methodology, not a hosted AI model. This page prepares the prompt safely; it does not expose an API key in your GitHub site.</div><div id="aiResultPanel" class="ai-result-panel"><div class="eyebrow">READY FOR AI</div><p>Your prompt is ready. Copy it and paste it into ChatGPT, Claude, or another AI assistant.</p><pre id="aiPromptPreview"></pre><button class="secondary" onclick="copyAIPrompt()">Copy prompt again</button><button class="secondary" onclick="openChatGPTAnswer()">Open ChatGPT ↗</button></div>
   </article>

   <div class="lesson-nav">${prevHtml}${nextHtml}</div>
 </section>
 <aside class="notes"><div class="notes-head"><div><div class="eyebrow">PERSONAL NOTES</div><h3>Lesson notebook</h3><p>Autosaves as you type. Formatting stays with this lesson.</p></div><span class="save-state" id="noteState">Ready</span></div>
   <div class="note-toolbar" role="toolbar" aria-label="Note formatting">
    <button type="button" onclick="formatNote('undo')" title="Undo">↶</button><button type="button" onclick="formatNote('redo')" title="Redo">↷</button><span class="toolbar-sep"></span>
    <button type="button" onclick="formatNote('bold')" title="Bold"><b>B</b></button><button type="button" onclick="formatNote('italic')" title="Italic"><i>I</i></button><button type="button" onclick="formatNote('underline')" title="Underline"><u>U</u></button>
    <select onchange="formatNote('formatBlock',this.value);this.value='P'" aria-label="Text style"><option value="P">Body</option><option value="H2">Heading</option><option value="H3">Subheading</option></select>
    <button type="button" onclick="formatNote('insertUnorderedList')" title="Bullet list">•</button><button type="button" onclick="formatNote('insertOrderedList')" title="Numbered list">1.</button>
    <button type="button" onclick="formatNote('justifyLeft')" title="Align left">≡</button><button type="button" onclick="formatNote('justifyCenter')" title="Center">≡</button>
    <span class="toolbar-sep"></span><button type="button" onclick="changeNoteSize(-1)" title="Decrease text">A−</button><button type="button" onclick="changeNoteSize(1)" title="Increase text">A+</button><button type="button" onclick="formatNote('removeFormat')" title="Clear inline formatting">Tx</button><button type="button" onclick="insertNoteTemplate()" title="Insert note template">＋ Template</button>
   </div>
   <div id="notes" class="rich-note" contenteditable="true" spellcheck="true" data-placeholder="Write your key ideas, examples, questions, and takeaways…">${noteHtml}</div>
   <div class="notes-footer"><span id="noteWords">0 words</span><div><button class="secondary" onclick="clearNotes()">Clear</button><button class="primary" onclick="saveNotes()">Save now</button></div></div>
 </aside>
 </div></div>`;
 $("#poster").onclick=()=>{startYouTube(v.id)};
 $("#notes").style.fontSize=(noteSizes[current]||16)+"px";$("#notes").addEventListener('input',()=>{updateNoteCount();queueNoteSave()});updateNoteCount();
 navActive(v.module);
}
function setVersion(v){version=v;renderLesson()}
function toggleDone(){done[current]=!done[current];persist(KEYS.done,done);toast(done[current]?"Lesson completed ✓":"Lesson marked incomplete");renderLesson();nav()}
function toggleBookmark(){bookmarks[current]=!bookmarks[current];persist(KEYS.book,bookmarks);toast(bookmarks[current]?"Bookmarked":"Bookmark removed");renderLesson()}
let noteSaveTimer=null;
function formatNote(command,value=null){$("#notes")?.focus();document.execCommand(command,false,value);updateNoteCount();queueNoteSave()}
function queueNoteSave(){clearTimeout(noteSaveTimer);const state=$("#noteState");if(state)state.textContent="Saving…";noteSaveTimer=setTimeout(()=>saveNotes(true),650)}
function changeNoteSize(delta){const el=$("#notes");if(!el)return;const next=Math.min(22,Math.max(12,(noteSizes[current]||15)+delta));noteSizes[current]=next;el.style.fontSize=next+"px";persist("sciwrite-v4-note-sizes",noteSizes);toast(delta>0?'Text size increased':'Text size decreased')}
function updateNoteCount(){const el=$("#notes"),c=$("#noteWords");if(!el||!c)return;const words=(el.innerText||'').trim().split(/\s+/).filter(Boolean).length;c.textContent=`${words} word${words===1?'':'s'}`}
function saveNotes(silent=false){const el=$("#notes");if(!el)return;notes[current]=el.innerHTML;persist(KEYS.notes,notes);$("#noteState").textContent="Saved just now";if(!silent)toast("Notes saved.")}
function clearNotes(){if(confirm("Clear notes for this lesson?")){notes[current]="";persist(KEYS.notes,notes);renderLesson();toast("Lesson notes cleared.")}}
function getPlainNote(html){const d=document.createElement('div');d.innerHTML=html||'';return d.innerText||d.textContent||''}
function aiPrompt(){const guide=(D.lessonGuides||{})[current]||{};const answer=( $("#aiAnswer")?.value||'').trim();return `You are my scientific-writing study coach. Use the lesson below to evaluate my understanding. Do not invent course content. Focus on whether my answer captures the main principle and correct any misunderstanding.\n\nCourse: Writing in the Sciences\nLesson: ${guide.title||titleFor(current)}\nKey ideas:\n${(guide.keyPoints||[]).map(x=>'- '+x).join('\n')}\n\nQuestion: ${guide.question||'What is the main idea of this lesson, and how would you apply it?'}\n\nMy answer:\n${answer}\n\nPlease respond with: 1) Verdict (correct / partly correct / incorrect), 2) What I got right, 3) What I missed or misunderstood, 4) A concise model answer, 5) One follow-up question.`}
async function copyAIPrompt(){const answer=$("#aiAnswer")?.value?.trim();if(!answer){toast("Write an answer first.");return}const prompt=aiPrompt();try{await navigator.clipboard.writeText(prompt);toast("AI prompt copied.")}catch{toast("Copy failed — select the prompt manually.")}}
async function openChatGPTAnswer(){const p=$("#aiPromptPreview")?.textContent||"";if(!p)return;try{await navigator.clipboard.writeText(p)}catch{}window.open("https://chatgpt.com/","_blank","noopener")}
async function checkWithAI(){const answer=$("#aiAnswer")?.value?.trim();if(!answer){toast("Write an answer first.");return}const prompt=aiPrompt();$("#aiPromptPreview").textContent=prompt;$("#aiResultPanel").classList.add("show");try{await navigator.clipboard.writeText(prompt);toast("Prompt prepared and copied. Paste it into your AI service.")}catch{toast("Prompt prepared below.")}}

function insertNoteTemplate(){const el=$("#notes");if(!el)return;el.focus();document.execCommand("insertHTML",false,"<h3>Key idea</h3><p></p><h3>Example / application</h3><p></p><h3>Question</h3><p></p>");updateNoteCount();queueNoteSave();}
function updateWatchUI(k){const p=Math.round(watchProgress[k]?.pct||0);$("#watchPercent")&&( $("#watchPercent").textContent=p+"%" );$("#watchBar")&&( $("#watchBar").style.width=p+"%" );}
function stopWatchTimer(){if(watchTimer){clearInterval(watchTimer);watchTimer=null}}
function saveWatchPosition(){if(!ytPlayer||typeof ytPlayer.getCurrentTime!=="function"||!current)return;const duration=ytPlayer.getDuration()||0,now=ytPlayer.getCurrentTime()||0;if(!duration)return;const pct=Math.min(100,Math.round(now/duration*100));watchProgress[current]={current:now,duration,pct,updatedAt:Date.now()};persist(KEYS.watch,watchProgress);updateWatchUI(current);if(pct>=90&&!done[current]){done[current]=true;persist(KEYS.done,done);toast("Video watched ✓ Lesson marked complete.");nav();}}
function onYTState(e){if(e.data===1){stopWatchTimer();watchTimer=setInterval(saveWatchPosition,2000)}else if(e.data===0){stopWatchTimer();saveWatchPosition()}else stopWatchTimer()}
function initYT(videoId){if(typeof YT==="undefined"||!YT.Player){setTimeout(()=>initYT(videoId),300);return}try{ytPlayer=new YT.Player("player",{videoId,playerVars:{rel:0,modestbranding:1,playsinline:1},events:{onStateChange:onYTState}})}catch{setTimeout(()=>initYT(videoId),500)}}
function startYouTube(videoId){const poster=$("#poster");if(poster)poster.style.display="none";stopWatchTimer();if(ytPlayer&&typeof ytPlayer.destroy==="function"){try{ytPlayer.destroy()}catch{}}ytPlayer=null;initYT(videoId)}
window.addEventListener("beforeunload",()=>{stopWatchTimer();saveWatchPosition()});
window.onYouTubeIframeAPIReady=()=>{if(current){const el=$("#poster");if(el&&el.style.display!=="none")return;const v=variants(current).find(x=>x.version===version)||variants(current)[0];if(v)initYT(v.id)}};

const QUIZZES={
 "1.1":[["Which edit most directly improves concision?","Remove words that add no meaning while preserving the claim.",["Add more background","Remove words that add no meaning while preserving the claim.","Use longer sentences","Replace every verb with a noun"]]],
 "1.2":[["Scientific writing is a skill that improves mainly through…","deliberate practice and revision",["memorizing vocabulary","writing only when inspired","avoiding revision","using more technical words"]]],
 "2.1":[["Which is generally the stronger scientific sentence?","The researchers measured blood pressure.",["Blood pressure was measured by the researchers.","The researchers measured blood pressure.","There was a measurement of blood pressure by the researchers.","A measurement was undertaken."]]],
 "2.2":[["A strong active verb usually makes the sentence…","more direct and precise",["longer","less specific","more passive","more abstract"]]],
 "3.1":[["A focused paragraph should primarily…","develop one main idea",["contain as many facts as possible","avoid repeating key terms","use only short sentences","start with a citation"]]],
 "3.2":[["Why can repeating a key term be useful in scientific writing?","It can improve clarity and coherence.",["It always reduces precision.","It makes the paper informal.","It replaces the need for logic.","It prevents paragraph structure."]]],
 "4.1":[["Good scientific writing normally requires…","substantial revision after drafting",["one perfect first draft","no prewriting","only grammar correction","avoiding feedback"]]],
 "5.1":[["Which section primarily reports what the study found?","Results",["Introduction","Methods","References"]]],
 "5.2":[["A strong Introduction should mainly…","establish the problem, context, and rationale",["repeat every result","review every paper ever published","describe the peer-review process","contain the full discussion"]]],
 "6.1":[["Plagiarism is best avoided by…","properly attributing and paraphrasing sources",["changing a few words","omitting citations","copying without quotation marks","citing only the abstract"]]],
 "6.2":[["Peer review is primarily intended to…","evaluate and improve the quality of scholarly work",["guarantee acceptance","replace the authors","remove the need for revision","select study participants"]]],
 "7.1":[["A review article primarily…","synthesizes existing literature",["reports only a new experiment","replaces peer review","avoids citations","contains no argument"]]],
 "8.1":[["Writing for a lay audience generally requires…","clear language and appropriate explanation of technical ideas",["more unexplained jargon","less context","only abbreviations","removing the main finding"]]]
};
function lessonQuiz(k){
 const q=(QUIZZES[k]||[])[0];if(!q)return "";
 const saved=quiz[k];return `<div class="panel" style="margin-top:24px"><div class="eyebrow">KNOWLEDGE CHECK</div><h3>${q[0]}</h3><div id="quiz-${k.replace(".","-")}">${q[2].map((x,i)=>`<button class="secondary quiz-option" style="display:block;width:100%;text-align:left;margin:6px 0" onclick="answerQuiz('${k}',${i})">${String.fromCharCode(65+i)}. ${x}</button>`).join("")}</div><div id="quizFeedback" style="margin-top:9px;color:${saved?.correct?"var(--success)":"var(--muted)"}">${saved? (saved.correct?"✓ Correct. Nice work.":"Review the concept and try again."):"Choose an answer to check your understanding."}</div></div>`;
}
function answerQuiz(k,i){
 const q=(QUIZZES[k]||[])[0];if(!q)return;const correct=q[2].indexOf(q[1])===i;quiz[k]={correct,answer:i};persist(KEYS.quiz,quiz);renderLesson();toast(correct?"Correct ✓":"Not quite — review the lesson.");}

function reviewLab(){
 const saved=localStorage.getItem("sciwrite-v6-review")||"";
 const modeHelp={full:"Review a complete manuscript for writing quality.",section:"Review one section such as Introduction, Methods, Results, or Discussion.",targeted:"Choose one writing problem to audit, such as clutter or passive voice.",interactive:"Work paragraph by paragraph and learn why each change is suggested."};
 const modeLabels={full:"Full review",section:"One section",targeted:"Targeted check",interactive:"Interactive"};
 const existing=localStorage.getItem("sciwrite-v6-review-prompt")||"";
 const source=localStorage.getItem("sciwrite-v7-workspace-review")||getWorkspaceCombined()||localStorage.getItem("sciwrite-v6-workshop")||saved;
 $("#main").innerHTML=`<div class="content"><div class="eyebrow">AI WRITING REVIEW</div><h1 style="margin:7px 0">Writing Review Lab</h1>
 <p class="lead-muted">This is the <b>AI review step</b>. Paste finished or nearly-finished writing here. The Lab applies the <b>labarba/sciwrite</b> methodology to writing clarity—not to study design, statistics, scientific validity, or citation formatting.</p>
 <div class="workflow-strip"><div class="workflow-step"><b>1. Write</b><span>Research Workspace</span></div><div class="workflow-arrow">→</div><div class="workflow-step active"><b>2. Review</b><span>Writing Review Lab</span></div><div class="workflow-arrow">→</div><div class="workflow-step"><b>3. Revise</b><span>Return to Workspace</span></div></div>
 <div class="review-lab-v6"><aside class="review-menu"><h3>Choose one job</h3>${["full","section","targeted","interactive"].map(x=>`<button class="mode-card ${reviewMode===x?"active":""}" onclick="setReviewMode('${x}')"><b>${modeLabels[x]}</b><small>${modeHelp[x]}</small></button>`).join("")}<div class="tool-note"><b>What this tool does</b><p>It follows five writing passes: clutter, voice/verbs, sentence architecture, terminology, and numerical/citation consistency.</p><a href="${D.reviewRepo.skillUrl}" target="_blank" rel="noopener">Read the actual SKILL.md ↗</a></div></aside>
 <section class="review-work-v6"><div class="section-title" style="margin-top:0"><div><h2>Your writing</h2><span>Paste one paragraph first if you are learning.</span></div><span id="reviewCount">0 words</span></div>
 <textarea id="reviewText" placeholder="Paste your scientific writing here…">${escape(source)}</textarea>
 <div class="review-actions"><button class="primary" onclick="makeReviewPrompt()">Generate AI review</button><button class="secondary" onclick="loadWorkspaceIntoReview()">Import Research Workspace</button><button class="secondary" onclick="clearReviewLab()">Clear</button></div>
 <div class="ai-handoff"><div class="eyebrow">AI EXECUTION</div><h3>Your site prepares the review; an AI model executes it</h3><p>GitHub Pages cannot safely contain a private AI API key, and the SciWrite repository is a review skill rather than a hosted AI service. Your generated review prompt is shown below so you can run it in an AI service without losing control of your manuscript.</p><div class="review-actions"><button class="primary" onclick="copyReviewPrompt()">Copy AI review prompt</button><button class="secondary" onclick="openChatGPTReview()">Open ChatGPT with prompt ↗</button></div></div>
 <div class="prompt-box" id="reviewPrompt">${existing?escape(existing):"Your review prompt will appear here after you click Generate AI review."}</div></section></div></div>`;
 const rt=$("#reviewText"); if(rt) rt.addEventListener("input",()=>{$("#reviewCount").textContent=`${(rt.value.trim().split(/\s+/).filter(Boolean)).length} words`;localStorage.setItem("sciwrite-v6-review",rt.value)}); if(rt){rt.dispatchEvent(new Event("input"))} navActive("review");
}
function reviewModeName(){return {full:["Full manuscript review","Apply all five writing-quality passes."],section:["Section review","Review one manuscript section."],targeted:["Targeted pass","Focus on a specific writing problem."],interactive:["Interactive editing","Go paragraph by paragraph and explain the changes."]}[reviewMode]}
function setReviewMode(m){reviewMode=m;reviewLab()}
function makeReviewPrompt(){const text=$("#reviewText")?.value.trim();if(!text){toast("Paste some writing first.");return}const mode=reviewModeName()[0];const target=reviewMode==="targeted"?"Ask which single writing dimension should be prioritized if the user has not specified one. Focus on clutter, passive voice/smothered verbs, sentence architecture, keyword consistency, and numerical/citation integrity.":"";const prompt=`You are an expert scientific-writing reviewer using the Writing in the Sciences methodology and the labarba/sciwrite framework.\n\nReview mode: ${mode}.\n${target}\n\nSTRICT SCOPE:\n- Improve writing clarity and precision only.\n- Do not change scientific meaning, data, technical claims, methods, results, or conclusions.\n- Do not perform a scientific peer review.\n- Preserve the author's voice when the original is already clear.\n\nRUN THESE FIVE PASSES:\n1. Clutter extraction.\n2. Voice and verb vitality.\n3. Sentence architecture.\n4. Keyword/terminology consistency.\n5. Numerical and citation integrity.\n\nOUTPUT:\n1. Overall assessment.\n2. Findings tagged CRITICAL / MAJOR / MINOR.\n3. For each finding: ORIGINAL → SUGGESTED REVISION → WHY.\n4. Top 5 highest-impact revisions.\n5. If interactive, review only the first paragraph and wait for approval before continuing.\n\nTEXT TO REVIEW:\n${text}`;localStorage.setItem("sciwrite-v6-review-prompt",prompt);$("#reviewPrompt").textContent=prompt;toast("AI review prompt generated.")}
async function copyReviewPrompt(){const p=$("#reviewPrompt")?.textContent||"";if(!p||p.includes("will appear here")){toast("Generate the review first.");return}try{await navigator.clipboard.writeText(p);toast("Review prompt copied.")}catch{toast("Copy blocked — select the prompt manually.")}}
async function openChatGPTReview(){const p=$("#reviewPrompt")?.textContent||"";if(!p||p.includes("will appear here")){toast("Generate the review first.");return}try{await navigator.clipboard.writeText(p);toast("Prompt copied. ChatGPT is opening…")}catch{}window.open("https://chatgpt.com/","_blank","noopener")}
function loadWorkspaceIntoReview(){const t=getWorkspaceCombined();if(!t){toast("Your Research Workspace is empty.");return}$("#reviewText").value=t;$("#reviewText").dispatchEvent(new Event("input"));toast("Research Workspace imported.")}
function clearReviewLab(){if(confirm("Clear the Review Lab text and generated prompt?")){localStorage.removeItem("sciwrite-v6-review");localStorage.removeItem("sciwrite-v6-review-prompt");reviewLab()}}

const WORKSPACE_SECTIONS=[
  ["abstract","Abstract","Summarize the problem, approach, main result, and conclusion."],
  ["introduction","Introduction","Set the problem, context, gap, and rationale."],
  ["methods","Methods","Describe what you did clearly enough for the reader to understand the approach."],
  ["results","Results","Report the findings directly; keep interpretation mainly for the Discussion."],
  ["discussion","Discussion","Interpret the findings, explain their meaning, limitations, and implications."]
];
let workspaceSection=localStorage.getItem("sciwrite-v7-workspace-section")||"abstract";
function getWorkspace(){
  let w=load("sciwrite-v7-workspace",null);
  if(w&&typeof w==="object")return w;
  const old=localStorage.getItem("sciwrite-v6-workshop")||localStorage.getItem("sciwrite-v4-workshop")||"";
  return {title:"My research manuscript",abstract:old,introduction:"",methods:"",results:"",discussion:""};
}
function getWorkspaceCombined(){const w=getWorkspace();return WORKSPACE_SECTIONS.map(([k,n])=>w[k]?.trim()?`## ${n}\n${w[k].trim()}`:"").filter(Boolean).join("\n\n");}
function researchWorkspace(){
 const w=getWorkspace(); if(!w.title)w.title="My research manuscript";
 const sec=WORKSPACE_SECTIONS.find(x=>x[0]===workspaceSection)||WORKSPACE_SECTIONS[0];
 const text=w[sec[0]]||"";
 const total=getWorkspaceCombined().trim().split(/\s+/).filter(Boolean).length;
 $("#main").innerHTML=`<div class="content"><div class="eyebrow">RESEARCH WRITING</div><h1 style="margin:7px 0">My Research Workspace</h1><p class="lead-muted">This is the place for your actual manuscript. Build the five core sections here, revise them yourself, then send one section or the whole manuscript to the Review Lab.</p>
 <div class="workspace-map"><div class="workspace-map-card"><b>1. Draft</b><span>Write your manuscript here.</span></div><div class="workspace-map-card"><b>2. Self-revise</b><span>Use the Writing in the Sciences principles.</span></div><div class="workspace-map-card"><b>3. Review</b><span>Send it to the Review Lab.</span></div><div class="workspace-map-card"><b>4. Decide</b><span>Keep only revisions that preserve your science.</span></div></div>
 <div class="workspace-v7"><section class="panel workspace-editor-v7"><div class="workspace-title-row"><div><div class="eyebrow">MANUSCRIPT</div><input id="workspaceTitle" value="${escape(w.title)}" aria-label="Manuscript title"></div><span id="workspaceTotal">${total} words</span></div>
 <div class="workspace-tabs">${WORKSPACE_SECTIONS.map(([k,n])=>`<button class="workspace-tab ${k===sec[0]?"active":""}" onclick="switchWorkspaceSection('${k}')"><b>${n}</b><small>${(w[k]||"").trim().split(/\s+/).filter(Boolean).length} words</small></button>`).join("")}</div>
 <div class="section-purpose"><b>${sec[1]}</b><span>${sec[2]}</span></div><textarea id="workspaceText" placeholder="Write your ${sec[1]} here…">${escape(text)}</textarea><div class="workspace-save-row"><span id="workspaceState">Autosaved locally</span><div><button class="primary" onclick="saveWorkspace()">Save</button><button class="secondary" onclick="sendCurrentWorkspaceToReview()">Review this section →</button><button class="secondary" onclick="sendWorkspaceToReview()">Review whole manuscript →</button></div></div></section>
 <aside class="panel workspace-side-v7"><div class="eyebrow">SELF-REVISION</div><h3>Before AI review</h3><div class="checklist">${["What is the one main point?","Can I remove words without losing meaning?","Are the verbs direct and precise?","Are key terms consistent?","Is each paragraph focused?","Did I preserve the scientific claim?"] .map((x,i)=>`<label class="check"><input type="checkbox" id="ws${i}"> <span>${x}</span></label>`).join("")}</div><div class="callout"><b>Review Lab</b><p>Use it after your own revision. It applies the SciWrite writing-quality framework; it is not a scientific peer reviewer.</p><button class="secondary" onclick="reviewLab()">Open Review Lab</button></div><div class="panel-mini"><b>Manuscript total</b><strong id="workspaceSideTotal">${total}</strong><small>words across five sections</small></div></aside></div></div>`;
 const ta=$("#workspaceText"),title=$("#workspaceTitle");
 const update=()=>{const data=getWorkspace();data.title=title.value;data[sec[0]]=ta.value;persist("sciwrite-v7-workspace",data);localStorage.setItem("sciwrite-v7-workspace-review",getWorkspaceCombined());const wc=ta.value.trim().split(/\s+/).filter(Boolean).length;const total2=getWorkspaceCombined().trim().split(/\s+/).filter(Boolean).length;$("#workspaceState").textContent="Autosaved just now";$("#workspaceTotal").textContent=`${total2} words`;$("#workspaceSideTotal").textContent=total2;const tab=$$('[data-x]');};
 ta.addEventListener("input",update);title.addEventListener("input",update); navActive("workspace");
}
function switchWorkspaceSection(k){workspaceSection=k;localStorage.setItem("sciwrite-v7-workspace-section",k);researchWorkspace()}
function saveWorkspace(){const ta=$("#workspaceText"),title=$("#workspaceTitle");if(!ta||!title)return;const w=getWorkspace();w.title=title.value;w[workspaceSection]=ta.value;persist("sciwrite-v7-workspace",w);localStorage.setItem("sciwrite-v7-workspace-review",getWorkspaceCombined());toast("Research workspace saved.")}
function sendCurrentWorkspaceToReview(){saveWorkspace();const w=getWorkspace();const sec=WORKSPACE_SECTIONS.find(x=>x[0]===workspaceSection);localStorage.setItem("sciwrite-v7-workspace-review",`## ${sec[1]}\n${w[workspaceSection]||""}`);reviewLab()}
function sendWorkspaceToReview(){saveWorkspace();localStorage.setItem("sciwrite-v7-workspace-review",getWorkspaceCombined());reviewLab()}
function clearWorkspaceSection(){const w=getWorkspace();if(confirm(`Clear ${WORKSPACE_SECTIONS.find(x=>x[0]===workspaceSection)[1]}?`)){w[workspaceSection]="";persist("sciwrite-v7-workspace",w);researchWorkspace()}}
function clearWorkshop(){clearWorkspaceSection()}

const CARDS=[
 ["What is the main goal of scientific writing?","Communicate the scientific idea clearly, precisely, and efficiently."],
 ["What is clutter?","Words or constructions that add little or no meaning and can be removed."],
 ["Why use strong active verbs?","They can make scientific prose more direct and easier to understand."],
 ["When can passive voice be useful?","When the action or result matters more than the actor, or when it improves flow and emphasis."],
 ["What makes a focused paragraph?","A clear main idea developed with sentences that support that idea."],
 ["Why repeat key terms?","Consistent terminology can improve clarity and cohesion in scientific writing."],
 ["What is prewriting for?","Planning the message, structure, evidence, and logical sequence before drafting."],
 ["Why revise extensively?","Good writing usually emerges through focused revision rather than a perfect first draft."],
 ["What does the Results section do?","It reports the study's findings, organized so readers can understand the evidence."],
 ["What does the Discussion do?","It interprets the findings, explains implications and limitations, and connects them to the broader literature."],
 ["What is plagiarism?","Using another person's words or ideas without appropriate attribution."],
 ["What is peer review?","A scholarly evaluation process intended to assess and improve the quality of research before publication."],
 ["What does a review article do?","Synthesizes and evaluates existing literature around a topic."],
 ["Why adapt science for broader audiences?","Because non-specialist readers need context and clear explanations without unnecessary jargon."]
];
let cardIndex=0,cardAnswer=false;
function reviewCenter(){
 $("#main").innerHTML=`<div class="content"><div class="eyebrow">SPACED REVIEW</div><h1 style="margin:7px 0">Review Center</h1><p style="color:var(--muted);max-width:850px">Use short retrieval practice to strengthen ideas from the course. This is original study material based on the course objectives, not official Coursera assessment content.</p>
 <div class="flash-wrap"><div class="flash-card"><div class="eyebrow">CARD ${cardIndex+1} / ${CARDS.length}</div><div class="question">${CARDS[cardIndex][0]}</div>${cardAnswer?`<div class="answer">${CARDS[cardIndex][1]}</div>`:`<button class="primary" style="margin:25px auto 0" onclick="showCardAnswer()">Show answer</button>`}</div><div class="flash-actions">${["Again","Hard","Good","Easy"].map(x=>`<button class="secondary" onclick="nextCard('${x}')">${x}</button>`).join("")}</div></div>
 <div class="section-title"><h2>Targeted review</h2><span>Based on your course progress</span></div><div class="resource-grid">${moduleEntries.map(([m,n])=>`<article class="resource-card" onclick="showModule('${m}')"><div class="r-icon">${pct(m)}%</div><h3>${n}</h3><p>${pct(m)<50?"Needs another pass":"On track"} — open unit practice</p></article>`).join("")}</div></div>`;
 navActive("reviewcenter");
}
function showCardAnswer(){cardAnswer=true;reviewCenter()}
function nextCard(rating){cardAnswer=false;cardIndex=(cardIndex+1)%CARDS.length;reviewCenter()}

function extrasView(){
 const extras=D.videos.filter(v=>v.module==="extra");
 const groups={demo:extras.filter(v=>/demo edit/i.test(v.title)),other:extras.filter(v=>!/demo edit/i.test(v.title))};
 const card=v=>`<article class="module-card extra-card" onclick="openExtra('${v.lesson}','${v.version}')"><div class="num">${/demo edit/i.test(v.title)?"DEMO EDIT":"EXTRA VIDEO"} • ${v.version==="new"?"NEWER":"ORIGINAL"}</div><h3>${escape(v.title)}</h3><p>Watch directly in the course player • YouTube</p><div class="mini-progress"><i style="width:${done["extra|"+v.lesson]?100:0}%"></i></div></article>`;
 $("#main").innerHTML=`<div class="content"><div class="eyebrow">EXTRA LIBRARY</div><h1 style="margin:7px 0">Extra & Demo Videos</h1><p class="lead-muted">These videos are intentionally outside the eight-unit lesson sequence, so they do not appear in the normal module progress. They are now collected here so you can find them easily.</p><div class="callout"><b>How to use them:</b> watch a demo after learning the related principle, pause before the edit, predict what you would change, then compare your reasoning with the demonstration.</div><div class="section-title"><h2>Demo edits</h2><span>${groups.demo.length} videos</span></div><div class="module-grid">${groups.demo.map(card).join("")}</div><div class="section-title"><h2>Other extras</h2><span>${groups.other.length} videos</span></div><div class="module-grid">${groups.other.map(card).join("")}</div></div>`;navActive("extras")
}
function openExtra(lesson,ver){const k="extra|"+lesson;current=k;version=ver;renderExtraLesson()}
function renderExtraLesson(){const vs=variants(current),v=vs.find(x=>x.version===version)||vs[0],guide=(D.lessonGuides||{})[current]||{};const thumb=`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;$("#main").innerHTML=`<div class="content"><div class="eyebrow">EXTRA VIDEO • ${v.version==="new"?"NEWER":"ORIGINAL"}</div><h1 class="lesson-title">${escape(v.title)}</h1><div class="lesson-meta">Extra library • YouTube</div><div class="video-shell" style="margin-top:18px"><div class="poster" id="poster" style="background-image:url('${thumb}')"><div class="play">▶</div></div><iframe id="player" style="display:none" title="${escape(v.title)}" src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><div class="video-fallback">If the embedded player is blocked, <a href="${v.url}" target="_blank" rel="noopener">open on YouTube ↗</a>.</div><div class="lesson-actions"><button class="primary" onclick="markExtraDone()">${done[current]?"✓ Completed":"Mark as complete"}</button>${vs.length>1?vs.map(x=>`<button class="pill ${x.version===version?"active":""}" onclick="openExtra('${x.lesson}','${x.version}')">${x.version==="new"?"Newer version":"Original version"}</button>`).join(""):""}<button class="secondary" onclick="extrasView()">← Back to extras</button></div><article class="lesson-guide panel"><div class="eyebrow">HOW TO STUDY THIS EXTRA</div><h2>${escape(guide.title||v.title)}</h2><p class="guide-summary">${escape(guide.summary||"Use this demonstration to observe how scientific prose is improved in practice.")}</p><ul>${(guide.keyPoints||["Watch the editing decisions.","Pause and predict changes.","Record one reusable revision principle."]).map(x=>`<li>${escape(x)}</li>`).join("")}</ul></article></div>`;$("#poster").onclick=()=>{$("#poster").style.display="none";$("#player").style.display="block";$("#player").src=`https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&autoplay=1`};navActive("extras")}
function markExtraDone(){done[current]=!done[current];persist(KEYS.done,done);renderExtraLesson();toast(done[current]?"Extra marked complete ✓":"Marked incomplete")}
function siteGuide(){
 $("#main").innerHTML=`<div class="content"><div class="eyebrow">START HERE</div><h1 style="margin:7px 0">How to use SciWrite Academy</h1><p class="lead-muted">Think of this website as a guided learning hub for the archived <b>Writing in the Sciences</b> course—not as a replacement for the course videos or for scientific peer review.</p><div class="guide-map"><div class="map-card"><span>01</span><b>Dashboard</b><small>Continue the course and see overall progress.</small></div><div class="map-card"><span>02</span><b>Course modules</b><small>Open Units 1–8 and study each lesson in sequence.</small></div><div class="map-card"><span>03</span><b>Lesson page</b><small>Watch → read the guide → answer → take notes → complete.</small></div><div class="map-card"><span>04</span><b>My Research Workspace</b><small>Build and revise your Abstract, Introduction, Methods, Results, and Discussion.</small></div><div class="map-card"><span>05</span><b>Writing Review Lab</b><small>Generate an AI review prompt using the SciWrite methodology.</small></div><div class="map-card"><span>06</span><b>Review Center</b><small>Use short flashcards to retrieve key concepts.</small></div><div class="map-card"><span>07</span><b>Extra & Demo Videos</b><small>Find the demo edits and other videos kept outside the normal sequence.</small></div><div class="map-card"><span>08</span><b>Resources</b><small>Open the course archive and companion SciWrite repository.</small></div></div><div class="section-title"><h2>The recommended workflow</h2><span>Keep the tools separate</span></div><div class="callout"><b>Learn:</b> Watch a lesson. <b>Understand:</b> Read its condensed guide and answer the question. <b>Record:</b> Take notes. <b>Practice:</b> Use the module task. <b>Write:</b> Put your manuscript into My Research Workspace. <b>Review:</b> Send it to Review Lab. <b>Decide:</b> Apply only revisions that preserve your intended scientific meaning.</div><div class="section-title"><h2>What is stored?</h2><span>Private to this browser</span></div><div class="panel"><p style="margin-top:0">Progress, notes, bookmarks, practice, quiz results, and Research Workspace drafts are stored in your browser's local storage. Use <b>Backup learning data</b> in the sidebar before clearing browser data or moving devices.</p></div></div>`;navActive("guide")
}

function resources(){
 $("#main").innerHTML=`<div class="content"><div class="eyebrow">RESOURCE LIBRARY</div><h1 style="margin:7px 0">Course Resources</h1><p style="color:var(--muted);max-width:900px">A curated library around the course, its archived material, and the companion writing-review workflow.</p>
 <div class="resource-grid">
  <article class="resource-card" onclick="window.open('https://github.com/quanghuy0497/Writing-in-the-Sciences','_blank')"><div class="r-icon">GH</div><h3>Course archive</h3><p>Eight archived units, syllabus, and course material.</p></article>
  <article class="resource-card" onclick="window.open('${D.reviewRepo.url}','_blank')"><div class="r-icon">✦</div><h3>SciWrite companion</h3><p>AI-assisted manuscript writing review framework based on Sainani's methodology.</p></article>
  <article class="resource-card" onclick="reviewLab()"><div class="r-icon">⌘</div><h3>Review Lab</h3><p>Generate a structured prompt for full, section, targeted, or interactive review.</p></article>
  <article class="resource-card" onclick="researchWorkspace()"><div class="r-icon">✎</div><h3>My Research Workspace</h3><p>Draft and revise the five core manuscript sections before AI review.</p></article>
 </div>
 <div class="section-title"><h2>Important scope note</h2><span>Keep the tools conceptually separate</span></div><div class="callout"><b>SciWrite is a writing-quality tool.</b> It should not be treated as an evaluator of study design, statistics, scientific validity, or citation formatting. Those are separate research skills to learn and check independently.</div></div>`;
 navActive("resources");
}
function bookmarkView(){
 const keys=lessonKeys.filter(k=>bookmarks[k]);
 $("#main").innerHTML=`<div class="content"><div class="eyebrow">YOUR LIBRARY</div><h1 style="margin:7px 0">Bookmarks</h1><p style="color:var(--muted)">Lessons you saved for later.</p>${keys.length?`<div class="module-grid">${keys.map(k=>`<article class="module-card" onclick="openLesson('${k}')"><div class="num">LESSON ${k.split("|")[1]}</div><h3>${titleFor(k)}</h3><p>${moduleTitles[k.split("|")[0]]}</p></article>`).join("")}</div>`:`<div class="empty">No bookmarks yet. Open a lesson and tap ★ Bookmark.</div>`}</div>`;
 navActive("bookmarks");
}
function statsView(){
 const p=overall(), completed=lessonKeys.filter(k=>done[k]).length;
 $("#main").innerHTML=`<div class="content"><div class="eyebrow">LEARNING ANALYTICS</div><h1 style="margin:7px 0">My Progress</h1><p style="color:var(--muted)">A simple private view of your learning activity on this device.</p>
 <div class="kpi-grid"><div class="stat-card"><div class="label">COURSE</div><div class="value">${p}%</div></div><div class="stat-card"><div class="label">LESSONS</div><div class="value">${completed}/${lessonKeys.length}</div></div><div class="stat-card"><div class="label">PRACTICE</div><div class="value">${countPractice()}</div></div><div class="stat-card"><div class="label">STREAK</div><div class="value">${streak()}d</div></div></div>
 <div class="section-title"><h2>Unit progress</h2><span>Completion by module</span></div><div class="panel">${moduleEntries.map(([m,n])=>`<div class="bar-row"><span>Unit ${m} · ${n}</span><div class="bar"><i style="width:${pct(m)}%"></i></div><b>${pct(m)}%</b></div>`).join("")}</div>
 <div class="section-title"><h2>Completion</h2><span>Personal certificate</span></div><div class="panel" style="text-align:center">${p===100?`<div class="eyebrow">CONGRATULATIONS</div><h2>You completed the course</h2><p style="color:var(--muted)">This is a personal learning certificate, not an official Stanford or Coursera credential.</p><button class="primary" onclick="printCertificate()">Print certificate</button>`:`<div class="progress-ring" style="--p:${p}"><span class="ring-text">${p}%</span></div><h3 style="margin-bottom:4px">Keep going</h3><p style="color:var(--muted);margin-top:0">${lessonKeys.length-completed} lessons remain.</p><button class="primary" onclick="openLesson('${lessonKeys.find(k=>!done[k])||lessonKeys[0]}')">Continue learning</button>`}</div></div>`;
 navActive("stats");
}
function printCertificate(){const w=window.open("","_blank");w.document.write(`<html><head><title>SciWrite Certificate</title><style>body{font-family:Georgia,serif;text-align:center;padding:90px;background:#f8fafc;color:#172033}h1{font-size:46px}p{font:16px Arial,sans-serif;color:#667085}.box{border:3px solid #2457d6;padding:70px;max-width:750px;margin:auto}</style></head><body><div class="box"><p>PERSONAL LEARNING CERTIFICATE</p><h1>Writing in the Sciences</h1><p>This certifies that</p><h2>Muhammad</h2><p>completed the personal SciWrite Academy learning path.</p><p>8 modules • ${lessonKeys.length} lessons</p><small>Not an official Stanford or Coursera credential.</small></div><script>window.print()<\/script></body></html>`);w.document.close()}

function exportData(){
 const payload={version:7,exportedAt:new Date().toISOString(),done,notes,bookmarks,practice,quiz,noteSizes,watchProgress,workspace:getWorkspace(),theme:localStorage.getItem(KEYS.theme)||"light"};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sciwrite-learning-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Backup exported.");
}
$("#importData").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);done=x.done||{};notes=x.notes||{};bookmarks=x.bookmarks||{};practice=x.practice||{};quiz=x.quiz||{};noteSizes=x.noteSizes||{};watchProgress=x.watchProgress||{};persist(KEYS.done,done);persist(KEYS.notes,notes);persist(KEYS.book,bookmarks);persist(KEYS.practice,practice);persist(KEYS.quiz,quiz);persist("sciwrite-v4-note-sizes",noteSizes);persist(KEYS.watch,watchProgress);if(x.workspace)localStorage.setItem("sciwrite-v7-workspace",JSON.stringify(x.workspace));toast("Learning data restored.");nav();home()}catch{toast("That backup file could not be read.")}};r.readAsText(f)};

function searchCourse(){
 const q=$("#searchInput").value.toLowerCase().trim();if(!q){$("#searchResults").innerHTML="<div class='empty'>Start typing to search lessons, modules, and saved notes.</div>";return}
 const results=[];
 lessons.forEach(v=>{const k=v.module+"|"+v.lesson,hay=(v.title+" "+v.lesson+" "+moduleTitles[v.module]).toLowerCase();if(hay.includes(q))results.push({type:"Lesson",title:titleFor(k),sub:`Module ${v.module} · Lesson ${v.lesson}`,action:`openLesson('${k}')`})});
 D.videos.filter(v=>v.module==="extra").forEach(v=>{const hay=(v.title+" "+v.lesson+" extra demo").toLowerCase();if(hay.includes(q))results.push({type:"Extra video",title:v.title,sub:"Extra & Demo Videos",action:`openExtra('${v.lesson}','${v.version}')`})});
 Object.entries(notes).forEach(([k,n])=>{const txt=getPlainNote(n).toLowerCase();if(txt.includes(q))results.push({type:"Note",title:titleFor(k),sub:"Saved note",action:`openLesson('${k}')`})});
 Object.entries(practice).filter(([k])=>k.startsWith("module-")).forEach(([k,n])=>{if(String(n).toLowerCase().includes(q))results.push({type:"Practice",title:`Unit ${k.split("-")[1]} practice`,sub:"Saved module practice",action:`showModule('${k.split("-")[1]}')`})});
 $("#searchResults").innerHTML=results.slice(0,25).map(r=>`<div class="result" onclick="${r.action};closeSearch()"><b>${escape(r.title)}</b><small>${r.type} • ${escape(r.sub)}</small></div>`).join("")||"<div class='empty'>No matches found.</div>";
}
function closeSearch(){$("#searchOverlay").classList.remove("open");$("#searchOverlay").setAttribute("aria-hidden","true")}
function escape(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

$("#menuBtn").onclick=()=>$("#sidebar").classList.contains("open")?closeSidebar():openSidebar();
$("#closeMenu").onclick=closeSidebar;
$("#sidebarBackdrop")?.addEventListener("click",closeSidebar);
document.addEventListener("click",e=>{if(window.innerWidth<=820&&$("#sidebar")?.classList.contains("open")&&!$("#sidebar").contains(e.target)&&e.target!==$("#menuBtn"))closeSidebar()});
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");const t=document.body.classList.contains("dark")?"dark":"light";localStorage.setItem(KEYS.theme,t);localStorage.setItem("sciwrite-v4-theme",t)}
if(localStorage.getItem(KEYS.theme)==="dark"||localStorage.getItem("sciwrite-v4-theme")==="dark")document.body.classList.add("dark");
$("#searchBtn").onclick=()=>{$("#searchOverlay").classList.add("open");$("#searchInput").focus();searchCourse()};
$("#closeSearch").onclick=closeSearch;$("#searchInput").oninput=searchCourse;
document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"&&document.activeElement.tagName!=="TEXTAREA"){e.preventDefault();$("#searchOverlay").classList.add("open");$("#searchInput").focus()}if(e.key==="Escape"){closeSearch()}});
nav();home();

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
