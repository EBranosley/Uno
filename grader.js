(()=>{
  let labStep=0;
  let labDone=false;
  const clean=s=>String(s||'').trim().replace(/^sudo\s+/,'').replace(/\s+/g,' ').replace(/\s*([>|])\s*/g,' $1 ');
  const splitExpected=()=>LAB[labI%LAB.length][2].split(/\s*;\s*/).map(clean).filter(Boolean);
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
  function resetGrader(){labStep=0;labDone=false;setTimeout(()=>{if(typeof page!=='undefined'&&page==='practice')paint('neutral',`<b>Graded terminal:</b> 0/${splitExpected().length} steps complete. Enter the first command from memory.`);else paint('neutral','<b>Free terminal mode.</b> Commands run here, but there is no assigned task to grade. Use Mixed Practice for right/wrong feedback.')},0)}
  function hint(){if(typeof page==='undefined'||page!=='practice')return;const exp=splitExpected();const next=exp[Math.min(labStep,exp.length-1)]||'';const family=next.split(/\s+/)[0]||'command';paint('help',`<b>Hint:</b> The next step uses <code>${family}</code>. Re-read the task and reconstruct the full command from memory. Progress: ${labStep}/${exp.length}.`)}
  window.showTerminalHint=hint;
  function gradeSubmitted(line){
    if(typeof page==='undefined'||page!=='practice'){paint('good','<b>✓ Command executed in the simulator.</b> Free practice mode does not judge task correctness.');return}
    const exp=splitExpected();
    const submitted=String(line||'').split(/\s*;\s*/).map(clean).filter(Boolean);
    for(const cmd of submitted){
      if(/^man\s+|^info\s+/.test(cmd)){paint('help',`<b>Reference consulted.</b> That does not count as a wrong attempt. Progress: ${labStep}/${exp.length}.`);continue}
      if(labDone){paint('good','<b>✓ This lab is already complete.</b> Add your explanation and tap Check & continue.');continue}
      const want=exp[labStep];
      if(equivalent(cmd,want)){
        labStep++;
        if(labStep>=exp.length){labDone=true;paint('good','<b>✓ Correct — terminal task complete.</b> Now explain what happened and why, then tap Check & continue.');}
        else paint('good',`<b>✓ Correct step.</b> ${labStep}/${exp.length} complete. Continue with the next command.`)
      }else{
        if(typeof S!=='undefined'&&S.mistakes){S.mistakes.push({q:'Terminal: '+LAB[labI%LAB.length][1],a:cmd,correct:want,when:Date.now()});if(typeof save==='function')save();}
        paint('bad',`<b>✗ Not quite.</b> That command does not match the next required step. Try again without resetting the terminal.<br><button onclick="showTerminalHint()" style="margin-top:8px;padding:6px 9px;border-radius:9px;border:1px solid #31506d;background:#13243a;color:#fff">Show a small hint</button>`)
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
  const oldGo=go;
  go=function(p){oldGo(p);if(p==='practice'||p==='term')setTimeout(resetGrader,0)};
  window.go=go;
})();
