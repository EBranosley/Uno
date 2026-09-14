// Terminal grading v5 — graded challenges in both Mixed Practice and Terminal Lab
(()=>{
  let labStep=0;
  let labDone=false;
  let freeLabIndex=Number(localStorage.getItem('lpi_terminal_lab_index')||0);
  const clean=s=>String(s||'').trim().replace(/^sudo\s+/,'').replace(/\s+/g,' ').replace(/\s*([>|])\s*/g,' $1 ');
  const currentLab=()=> (typeof page!=='undefined'&&page==='term') ? LAB[freeLabIndex%LAB.length] : LAB[labI%LAB.length];
  const splitExpected=()=>currentLab()[2].split(/\s*;\s*/).map(clean).filter(Boolean);
  const equivalent=(actual,expected)=>{
    actual=clean(actual); expected=clean(expected);
    if(actual===expected) return true;
    if(expected==='ip addr show' && ['ip a','ip addr','ip address show'].includes(actual)) return true;
    if(expected==='ss -t' && /^ss\s+.*t/.test(actual)) return true;
    if(expected==='ls -a' && /^ls\s+.*a/.test(actual)) return true;
    if(expected==='man passwd' && ['man passwd','man 1 passwd'].includes(actual)) return true;
    if(expected==='pwd' && actual==='pwd') return true;
    return false;
  };
  function gradeBox(){return document.getElementById('termgrade')}
  function paint(type,html){const b=gradeBox();if(!b)return;const palette={good:['#0b211a','#2f6b50','#bdf5cf'],bad:['#261017','#6b3340','#ffd1d7'],help:['#0c1c2b','#315d78','#bfe8ff'],neutral:['#0a1725','#31506d','#bfd2df']}[type]||['#0a1725','#31506d','#bfd2df'];b.style.background=palette[0];b.style.border=`1px solid ${palette[1]}`;b.style.color=palette[2];b.innerHTML=html}
  function resetGrader(){labStep=0;labDone=false;setTimeout(()=>{if(typeof page!=='undefined'&&(page==='practice'||page==='term'))paint('neutral',`<b>Graded terminal:</b> 0/${splitExpected().length} steps complete. Enter the first command from memory.`)},0)}
  function hint(){if(typeof page==='undefined'||(page!=='practice'&&page!=='term'))return;const exp=splitExpected();const next=exp[Math.min(labStep,exp.length-1)]||'';const family=next.split(/\s+/)[0]||'command';paint('help',`<b>Hint:</b> The next step uses <code>${family}</code>. Re-read the task and reconstruct the full command from memory. Progress: ${labStep}/${exp.length}.`)}
  window.showTerminalHint=hint;
  function completeCurrentLab(){
    const l=currentLab();
    if(typeof S!=='undefined'){
      S.done[l[0]]=1;
      S.labs=S.labs||{};
      const key=(page==='term'?'terminal-':'mixed-')+(page==='term'?freeLabIndex:labI);
      S.labs[key]=1;
      if(typeof save==='function')save();
    }
  }
  function gradeSubmitted(line){
    if(typeof page==='undefined'||(page!=='practice'&&page!=='term'))return;
    const exp=splitExpected();
    const submitted=String(line||'').split(/\s*;\s*/).map(clean).filter(Boolean);
    for(const cmd of submitted){
      if(/^man\s+|^info\s+/.test(cmd) && !equivalent(cmd,exp[labStep])){paint('help',`<b>Reference consulted.</b> That does not count as a wrong attempt. Progress: ${labStep}/${exp.length}.`);continue}
      if(labDone){paint('good',page==='term'?'<b>✓ Challenge complete.</b> Tap Next challenge when you are ready.':'<b>✓ This lab is already complete.</b> Add your explanation and tap Check & continue.');continue}
      const want=exp[labStep];
      if(equivalent(cmd,want)){
        labStep++;
        if(labStep>=exp.length){
          labDone=true;completeCurrentLab();
          if(page==='term') paint('good','<b>✓ Correct — challenge complete.</b><br>You completed every required terminal step correctly.<br><button onclick="nextTerminalChallenge()" style="margin-top:8px;padding:8px 10px;border-radius:9px;border:1px solid #2f6b50;background:#0f6b5a;color:#fff;font-weight:700">Next challenge</button>');
          else paint('good','<b>✓ Correct — terminal task complete.</b> Now explain what happened and why, then tap Check & continue.');
        } else paint('good',`<b>✓ Correct step.</b> ${labStep}/${exp.length} complete. Continue with the next command.`)
      }else{
        if(typeof S!=='undefined'&&S.mistakes){S.mistakes.push({q:'Terminal: '+currentLab()[1],a:cmd,correct:want,when:Date.now()});if(typeof save==='function')save();}
        paint('bad',`<b>✗ Not quite.</b> That is not the next command needed for this task. Your terminal state is kept, so try again.<br><button onclick="showTerminalHint()" style="margin-top:8px;padding:6px 9px;border-radius:9px;border:1px solid #31506d;background:#13243a;color:#fff">Show a small hint</button>`)
      }
    }
  }
  const oldTerminalBox=terminalBox;
  terminalBox=function(){return oldTerminalBox()+`<div id="termgrade" style="margin-top:9px;padding:10px;border-radius:10px;border:1px solid #31506d;background:#0a1725;color:#bfd2df;font-size:12px;line-height:1.45"></div>`};
  const oldRunLine=runLine;
  runLine=function(line){oldRunLine(line);gradeSubmitted(line)};
  window.runLine=runLine;
  const oldPractice=practice;
  practice=function(){resetGrader();oldPractice();setTimeout(resetGrader,0)};
  const oldFinishLab=finishLab;
  finishLab=function(){if(typeof page!=='undefined'&&page==='practice'&&!labDone){const m=document.getElementById('labmsg');if(m)m.innerHTML='<p style="color:var(--red)"><b>Complete the terminal task correctly before continuing.</b></p>';paint('bad','<b>✗ Terminal task incomplete.</b> Finish the required command sequence first.');return}oldFinishLab()};
  window.finishLab=finishLab;
  term=function(){
    const l=currentLab();
    V.innerHTML=`<h2>Terminal Lab</h2><div class="card"><div class="space"><span class="pill">Objective ${l[0]}</span><span class="muted small">Challenge ${(freeLabIndex%LAB.length)+1}/${LAB.length}</span></div><h3>Task</h3><p>${l[1]}</p><p class="muted small">Write the commands from memory. You will get immediate right/wrong feedback after each Enter.</p>${terminalBox()}<div class="row" style="margin-top:10px"><button class="btn" onclick="showTerminalHint()">Small hint</button><button class="btn" onclick="runLine('man '+(splitExpected()[Math.min(labStep,splitExpected().length-1)]||'ls').split(/\s+/)[0])">Check man page</button></div></div>`;
    setTimeout(()=>{bindTerm();resetGrader()},0)
  };
  window.nextTerminalChallenge=function(){freeLabIndex=(freeLabIndex+1)%LAB.length;localStorage.setItem('lpi_terminal_lab_index',String(freeLabIndex));term()};
  const oldGo=go;
  go=function(p){oldGo(p);if(p==='practice')setTimeout(resetGrader,0)};
  window.go=go;
})();
