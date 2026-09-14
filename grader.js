// LPI Lab Trainer grading + detailed explanations v6
(()=>{
  let labStep=0;
  let labDone=false;
  let freeLabIndex=Number(localStorage.getItem('lpi_terminal_lab_index')||0);

  const clean=s=>String(s||'').trim().replace(/^sudo\s+/,'').replace(/\s+/g,' ').replace(/\s*([>|])\s*/g,' $1 ');
  const h=s=>typeof esc==='function'?esc(String(s)):String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const currentLab=()=> (typeof page!=='undefined'&&page==='term') ? LAB[freeLabIndex%LAB.length] : LAB[labI%LAB.length];
  const splitExpected=()=>currentLab()[2].split(/\s*;\s*/).map(clean).filter(Boolean);

  const QUESTION_EXPLANATIONS={
    'Which command shows your current directory?':{
      why:'<code>pwd</code> means “print working directory.” It asks the shell to display the absolute path of the directory you are currently in. This is different from changing directories or listing their contents.',
      wrong:{'cd':'<code>cd</code> changes the current directory; it does not print the current path.','ls':'<code>ls</code> lists directory contents; it does not specifically report your current working directory.','who':'<code>who</code> shows logged-in users.'},
      demo:'Run <code>pwd</code>, then <code>cd /etc</code>, then <code>pwd</code> again. The second path changes because <code>cd</code> changed your working directory.'},
    'Which command recursively removes a directory tree?':{
      why:'<code>rm -r</code> removes a directory and recursively descends into its subdirectories and files. Recursion is required because a directory tree can contain additional directories and files beneath it.',
      wrong:{'rmdir -a':'<code>rmdir</code> is intended for empty directories and does not remove a populated tree this way.','mv -r':'<code>mv</code> moves or renames files; <code>-r</code> is not the command for recursive deletion.','del -r':'<code>del</code> is not the standard Linux utility for this task.'},
      demo:'Create a test tree with <code>mkdir -p demo/a/b</code>, then remove it with <code>rm -r demo</code>.'},
    'Which command exports NAME to child processes?':{
      why:'<code>export NAME</code> marks an existing shell variable for inclusion in the environment inherited by child processes. A normal shell variable exists in the current shell, while an exported variable is passed to programs launched from that shell.',
      wrong:{'local NAME':'<code>local</code> is used mainly inside shell functions to limit variable scope.','echo NAME':'<code>echo</code> prints text; it does not change environment inheritance.','type NAME':'<code>type</code> reports how a command name would be interpreted by the shell.'},
      demo:'Try <code>NAME=linux</code>, then <code>export NAME</code>. The variable is now part of the shell environment for child processes.'},
    'Which manual section commonly documents config files?':{
      why:'Manual section 5 is used for file formats and configuration files. Linux man pages are divided into sections so the same name can refer to different kinds of documentation.',
      wrong:{'1':'Section 1 normally documents user commands.','3':'Section 3 normally documents library functions.','8':'Section 8 commonly documents system-administration commands.'},
      demo:'Compare <code>man passwd</code> with <code>man 5 passwd</code>. One describes the command; the other describes the passwd file format.'},
    'Which tar option extracts?':{
      why:'The <code>x</code> operation tells <code>tar</code> to extract files from an archive. In a command such as <code>tar -xf archive.tar</code>, <code>x</code> selects extraction and <code>f</code> identifies the archive filename.',
      wrong:{'c':'<code>c</code> creates an archive.','t':'<code>t</code> lists an archive’s contents.','v':'<code>v</code> is verbose output; it is not the primary archive operation.'},
      demo:'Use <code>tar -tf archive.tar</code> to inspect an archive first, then <code>tar -xf archive.tar</code> to extract it.'},
    'Which symbol sends output into another command?':{
      why:'The pipe symbol <code>|</code> connects the standard output of the command on the left to the standard input of the command on the right. This lets small commands be combined into processing pipelines.',
      wrong:{'>':'<code>&gt;</code> redirects output into a file and overwrites that file.','&':'<code>&amp;</code> is commonly used to run a command in the background.',';':'A semicolon separates commands so they run sequentially; it does not connect their input/output streams.'},
      demo:'Run <code>cat /etc/passwd | grep root</code>. <code>cat</code> produces text and <code>grep</code> receives that text through the pipe.'},
    'Which variable contains the previous exit status?':{
      why:'<code>$?</code> stores the exit status of the most recently completed command. By convention, an exit status of <code>0</code> normally means success, while a non-zero value indicates some kind of failure or alternate condition.',
      wrong:{'$#':'<code>$#</code> is the number of positional arguments passed to a script.','$@':'<code>$@</code> represents all positional arguments.','$PWD':'<code>$PWD</code> contains the current working directory.'},
      demo:'Run a successful command such as <code>true</code> or <code>ls</code>, then <code>echo $?</code>. Then run a command that fails and check <code>$?</code> again.'},
    'Which command is a live/dynamic process viewer?':{
      why:'<code>top</code> repeatedly refreshes process and system information, so it provides a dynamic view. In contrast, <code>ps</code> normally gives a snapshot of processes at the moment it is run.',
      wrong:{'ps':'<code>ps</code> is primarily a process snapshot rather than a continuously refreshing view.','cat':'<code>cat</code> displays or concatenates file content.','last':'<code>last</code> shows login history.'},
      demo:'Run <code>ps</code> and note the static output, then run <code>top</code> and observe that the display refreshes.'},
    'Which file normally stores DNS resolver settings?':{
      why:'<code>/etc/resolv.conf</code> contains DNS resolver configuration such as nameserver entries. Resolver settings tell the system where to send DNS queries when translating hostnames into IP addresses.',
      wrong:{'/etc/hosts':'<code>/etc/hosts</code> contains local static hostname-to-address mappings.','/etc/passwd':'<code>/etc/passwd</code> contains user account information.','/proc/net':'<code>/proc</code> exposes runtime kernel/process information; it is not the normal resolver configuration file.'},
      demo:'Inspect <code>cat /etc/resolv.conf</code> and compare it with <code>cat /etc/hosts</code>.'},
    'Which command lists socket information?':{
      why:'<code>ss</code> displays socket information. Options narrow the view, for example <code>-t</code> for TCP, <code>-u</code> for UDP, <code>-l</code> for listening sockets, and <code>-p</code> for process information when permitted.',
      wrong:{'pwd':'<code>pwd</code> prints the working directory.','wc':'<code>wc</code> counts lines, words, and bytes/characters.','who':'<code>who</code> shows logged-in users.'},
      demo:'Try <code>ss -t</code> for TCP sockets and <code>ss -l</code> for listening sockets.'},
    'Which file normally stores password hashes?':{
      why:'On systems using shadow passwords, password hashes are stored in <code>/etc/shadow</code>, which has more restrictive permissions. <code>/etc/passwd</code> remains broadly readable because many programs need general account information.',
      wrong:{'/etc/passwd':'This stores general user account fields and typically contains an <code>x</code> placeholder in the password field when shadow passwords are used.','/etc/group':'This stores group information.','/etc/skel':'This contains template files copied into new users’ home directories.'},
      demo:'Compare the permissions and contents of <code>/etc/passwd</code> and <code>/etc/shadow</code>.'},
    'Which command creates a group?':{
      why:'<code>groupadd</code> creates a new group entry. Groups are used to organize users and assign shared permissions to files and directories.',
      wrong:{'useradd':'<code>useradd</code> creates a user account.','chmod':'<code>chmod</code> changes file or directory permission bits.','chgrpadd':'<code>chgrpadd</code> is not the standard command for creating groups.'},
      demo:'Run <code>groupadd lab</code> in the simulator, then inspect the simulated group database.'},
    'What is rw-r--r-- in octal?':{
      why:'Permissions are converted using read=4, write=2, execute=1. Owner <code>rw-</code> is 4+2=6. Group <code>r--</code> is 4. Others <code>r--</code> is 4. Therefore the numeric mode is <code>644</code>.',
      wrong:{'744':'744 would give the owner execute permission: <code>rwxr--r--</code>.','664':'664 would give the group write permission: <code>rw-rw-r--</code>.','444':'444 would remove the owner write permission: <code>r--r--r--</code>.'},
      demo:'Create a file, run <code>chmod 644 file</code>, then inspect it with <code>ls -l</code>.'},
    'Which command creates a symbolic link?':{
      why:'<code>ln -s TARGET LINKNAME</code> creates a symbolic link. A symbolic link stores a path that points to another file or directory rather than being another directory entry for the same inode.',
      wrong:{'cp -s':'<code>cp</code> copies data; this is not the standard symbolic-link command.','link -v':'The <code>link</code> utility relates to hard links, not this symbolic-link syntax.','mklink':'<code>mklink</code> is associated with Windows command environments, not standard Linux usage.'},
      demo:'Run <code>touch target.txt</code>, then <code>ln -s target.txt target-link</code>, and inspect it with <code>ls -l</code>.'},
    'Which license family is generally permissive?':{
      why:'BSD licenses are commonly described as permissive. They allow broad reuse and modification with relatively few redistribution requirements. This contrasts with copyleft licenses, which require derivative redistribution to preserve specified freedoms and licensing conditions.',
      wrong:{'GPL':'GPL is a copyleft license.','AGPL':'AGPL is also a strong copyleft license with additional network-use provisions.','Copyleft':'Copyleft is the opposite licensing approach from permissive licensing.'},
      demo:'Remember the high-level contrast: GPL → copyleft; BSD → permissive.'}
  };

  const LAB_DETAILS={
    'Navigate home, print the current path, then list hidden files.':'<b>Step 1 — <code>cd ~</code>:</b> <code>~</code> expands to the current user’s home directory, so this changes the shell’s working directory to that location.<br><br><b>Step 2 — <code>pwd</code>:</b> prints the resulting working directory so you can verify where the shell is operating.<br><br><b>Step 3 — <code>ls -a</code>:</b> lists entries including names that begin with a dot. Those dot-prefixed names are normally hidden from a plain <code>ls</code>.',
    'Create labs/week1 recursively, then create notes.txt inside it.':'<b><code>mkdir -p labs/week1</code></b> creates the full directory path and any missing parent directories. Without <code>-p</code>, creating a nested child can fail when its parent does not exist.<br><br><b><code>touch labs/week1/notes.txt</code></b> creates the file if it does not already exist; if it exists, <code>touch</code> updates its timestamps.',
    'Create variable greeting=hello, display it, then export it.':'<b><code>greeting=hello</code></b> creates a shell variable in the current shell. There must not be spaces around the assignment operator in normal shell assignment syntax.<br><br><b><code>echo $greeting</code></b> uses <code>$</code> expansion to substitute the variable’s value.<br><br><b><code>export greeting</code></b> marks the variable for inheritance by child processes, changing it from shell-only state into part of the process environment.',
    'Open the command manual for passwd, then the passwd file-format manual.':'<b><code>man passwd</code></b> resolves the normal command manual page, typically from section 1.<br><br><b><code>man 5 passwd</code></b> explicitly requests section 5, which documents file formats and configuration files. The exercise demonstrates why man-page section numbers matter when multiple pages share the same name.',
    'Create files a.txt and b.txt, archive them into files.tar, then list the archive.':'<b><code>touch a.txt b.txt</code></b> creates the source files. <b><code>tar -cf files.tar a.txt b.txt</code></b> creates an archive: <code>c</code> means create and <code>f</code> says the next argument is the archive filename. <b><code>tar -tf files.tar</code></b> lists the archive: <code>t</code> means table/list. Plain tar archives data; compression is a separate operation unless a compression option such as <code>z</code>, <code>j</code>, or <code>J</code> is selected.',
    'Write hello to note.txt, append world, then display only lines containing world.':'<b><code>echo hello &gt; note.txt</code></b> redirects standard output into the file and overwrites existing contents. <b><code>echo world &gt;&gt; note.txt</code></b> appends instead of overwriting. <b><code>grep world note.txt</code></b> searches the file and prints matching lines. The task connects output redirection with text filtering.',
    'Show a process snapshot and then a live process view.':'<b><code>ps</code></b> reports a process snapshot at the moment the command runs. <b><code>top</code></b> repeatedly refreshes process/system statistics, so it is useful for observing change over time. Every process has a PID, and processes also have PPIDs that identify their parent process.',
    'Show network addresses and then socket information.':'<b><code>ip addr show</code></b> displays interfaces and their assigned addresses, including IPv4/IPv6 information. <b><code>ss -t</code></b> shows TCP sockets. Together they answer different questions: <code>ip</code> describes interface configuration; <code>ss</code> describes communication endpoints.',
    'Create a group named lab and a user named student2.':'<b><code>groupadd lab</code></b> creates a group entry. <b><code>useradd student2</code></b> creates a user account. Linux account data is represented through files such as <code>/etc/passwd</code>, <code>/etc/group</code>, and shadow files used to protect password-related data.',
    'Create script.sh and give owner rwx, group r-x, others r-x.':'<b><code>touch script.sh</code></b> creates the file. <b><code>chmod 755 script.sh</code></b> sets permissions numerically: 7=4+2+1=<code>rwx</code>, while 5=4+1=<code>r-x</code>. Therefore 755 means owner <code>rwx</code>, group <code>r-x</code>, others <code>r-x</code>.',
    'Create target.txt and a symbolic link called target-link.':'<b><code>touch target.txt</code></b> creates the target. <b><code>ln -s target.txt target-link</code></b> creates a symbolic link whose stored path points to the target. A symbolic link is distinct from a hard link and can become broken if its target path no longer resolves.'
  };

  const CARD_CONTEXT={
    '1.1':'This objective focuses on Linux distributions, embedded systems, and Linux in cloud environments. Connect each term to why different distributions or release models exist.',
    '1.3':'This objective distinguishes free/open-source philosophy and license families. Focus on how licensing affects reuse, modification, redistribution, and derivative works.',
    '1.4':'This objective covers practical Linux working environments, desktop interfaces, terminals, industry use, and privacy concepts.',
    '2.1':'This objective covers shell syntax, variables, quoting, command lookup, and environment behavior. Always connect a command to how the shell parses and executes it.',
    '2.2':'This objective is about finding authoritative help using man pages, info pages, documentation directories, and lookup tools.',
    '2.3':'This objective covers filesystem navigation and listing. Be able to reason about current location, home directories, hidden files, absolute paths, and relative paths.',
    '2.4':'This objective covers creating, moving, copying, and deleting files/directories plus case sensitivity and shell globbing.',
    '3.1':'This objective separates archiving from compression and requires recognition of common tar operations and compression utilities.',
    '3.2':'This objective combines standard input/output, redirection, pipelines, grep, text utilities, and regular-expression basics.',
    '3.3':'This objective covers shell scripts, interpreters, variables, arguments, loops, conditionals, and exit status.',
    '4.3':'This objective connects Linux filesystem locations with processes, memory, kernel messages, and logging.',
    '4.4':'This objective covers network configuration, routing, name resolution, addressing, and socket inspection.',
    '5.1':'This objective distinguishes root, normal users, system users, privilege changes, login information, and core account files.',
    '5.2':'This objective covers how users and groups are represented and created, including UID/GID-related account data.',
    '5.3':'This objective requires interpreting and changing Linux ownership and permission bits in symbolic and numeric form.',
    '5.4':'This objective covers temporary directories, the sticky bit, and link behavior.'
  };

  const CARD_EXAMPLES={
    'What does PATH control?':'Example: if <code>/usr/local/bin</code> appears before <code>/usr/bin</code>, a matching executable in the first directory can be selected first.',
    'How do you make a shell variable available to subprocesses?':'Example: <code>NAME=linux; export NAME</code> makes <code>NAME</code> available in programs launched afterward.',
    'What does man 5 passwd show?':'Use <code>man passwd</code> and <code>man 5 passwd</code> side by side to see how section selection changes the document.',
    'What does ~ represent?':'Example: <code>cd ~</code> returns you to your home directory from anywhere in the filesystem.',
    'What does ? match in shell globbing?':'Example: <code>ls question1?</code> can match <code>question13</code> but not <code>question1</code> or <code>question123</code>.',
    'What does mkdir -p do?':'Example: <code>mkdir -p a/b/c</code> can create all three levels in one command.',
    'Does tar inherently compress?':'Think “tar groups files; gzip/bzip2/xz shrink data.” Compression can be integrated with tar options, but the concepts remain distinct.',
    'What does tar -tf archive.tar do?':'The <code>t</code> operation inspects contents without extracting them; <code>f</code> supplies the archive filename.',
    'What does > do?':'Be careful: <code>echo new &gt; file</code> replaces prior file contents.',
    'What does >> do?':'Example: <code>echo next &gt;&gt; file</code> adds a new line without discarding earlier content.',
    'What does | do?':'Example: <code>ps | grep bash</code> filters process output through <code>grep</code>.',
    'What is $?':'Check it immediately after the command you care about, because running another command replaces the stored status.',
    'What exit status usually means success?':'Shell scripts commonly test for 0 to follow a success branch and non-zero values for error handling.',
    'What does a shebang do?':'Example: <code>#!/bin/bash</code> tells the system to use Bash to interpret the script.',
    'What is a PID?':'A PID lets tools such as <code>ps</code> and the <code>/proc/&lt;PID&gt;</code> hierarchy refer to one running process.',
    'What is a PPID?':'The PPID links a process to the process that created it, forming a process hierarchy.',
    'Which command gives a dynamic process view?':'Compare <code>ps</code> for a snapshot with <code>top</code> for continuously updated information.',
    'Where are most variable log files kept?':'Examples are commonly found beneath <code>/var/log</code>, while kernel messages can also be inspected with <code>dmesg</code>.',
    'What does /proc expose?':'Example: <code>/proc/&lt;PID&gt;</code> exposes runtime information associated with a process.',
    'What does ip addr show display?':'Use it to see interface names and assigned IPv4/IPv6 addresses before troubleshooting connectivity.',
    'What is /etc/hosts used for?':'Entries can provide local static name resolution independently of a DNS query.',
    'What is /etc/resolv.conf used for?':'Look for resolver/nameserver configuration that tells the system where DNS queries should go.',
    'Which command checks sockets?':'Examples: <code>ss -t</code> TCP, <code>ss -u</code> UDP, <code>ss -l</code> listening.',
    'Where are password hashes normally stored?':'The shadow design keeps password hashes away from the broadly readable <code>/etc/passwd</code> file.',
    'What UID belongs to root?':'UID 0 is special because it identifies the superuser account.',
    'What does useradd do?':'Creating a user affects account database information and often interacts with defaults such as <code>/etc/skel</code>.',
    'What does groupadd do?':'Groups provide a way to assign shared access through group ownership and group permission bits.',
    'What does chmod change?':'Example: <code>chmod 640 file</code> changes permission bits without changing file ownership.',
    'What does chown change?':'Example: <code>chown user:group file</code> changes owner and group ownership.',
    'What octal value is rwx?':'Compute permissions as read 4 + write 2 + execute 1 = 7.',
    'What does -rwsr-xr-x indicate?':'The lowercase <code>s</code> in the owner execute position indicates SUID is set and owner execute is also present.',
    'What does ln -s create?':'Example: <code>ln -s target linkname</code> creates a path-based reference to the target.',
    'Why is the sticky bit used on shared directories?':'A classic use is a shared writable directory where users should not be able to delete files owned by other users.',
    'Copyleft vs permissive?':'Use GPL as a common copyleft example and BSD as a common permissive example.',
    'What is an LTS release?':'LTS emphasizes a longer maintenance/support lifecycle than ordinary releases.',
    'Name two major Linux desktop environments.':'GNOME and KDE provide different desktop experiences while both run on Linux.'
  };

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
  function hint(){if(typeof page==='undefined'||(page!=='practice'&&page!=='term'))return;const exp=splitExpected();const next=exp[Math.min(labStep,exp.length-1)]||'';const family=next.split(/\s+/)[0]||'command';paint('help',`<b>Hint:</b> The next step uses <code>${h(family)}</code>. Re-read the task and reconstruct the full command from memory. Progress: ${labStep}/${exp.length}.`)}
  window.showTerminalHint=hint;

  function labDetail(l){return LAB_DETAILS[l[1]]||`<b>Expected sequence:</b> <code>${h(l[2])}</code><br><br>${h(l[3])}`}
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
      if(/^man\s+|^info\s+/.test(cmd) && !equivalent(cmd,exp[labStep])){paint('help',`<b>Reference consulted.</b> Good study behavior: checking documentation does not count as a wrong attempt. Progress: ${labStep}/${exp.length}.`);continue}
      if(labDone){paint('good',page==='term'?`<b>✓ Challenge complete.</b><br><br>${labDetail(currentLab())}<br><br><button onclick="nextTerminalChallenge()" style="padding:8px 10px;border-radius:9px;border:1px solid #2f6b50;background:#0f6b5a;color:#fff;font-weight:700">Next challenge</button>`:'<b>✓ Terminal portion complete.</b> Write your own explanation below, then tap Check & continue to compare it with the detailed explanation.');continue}
      const want=exp[labStep];
      if(equivalent(cmd,want)){
        labStep++;
        if(labStep>=exp.length){
          labDone=true;completeCurrentLab();
          if(page==='term') paint('good',`<b>✓ Correct — challenge complete.</b><br><br><b>Detailed explanation</b><br>${labDetail(currentLab())}<br><br><button onclick="nextTerminalChallenge()" style="padding:8px 10px;border-radius:9px;border:1px solid #2f6b50;background:#0f6b5a;color:#fff;font-weight:700">Next challenge</button>`);
          else paint('good','<b>✓ Correct — terminal task complete.</b> Now explain in your own words what happened and why. Your explanation will be compared with a detailed model explanation.');
        } else paint('good',`<b>✓ Correct step.</b> ${labStep}/${exp.length} complete. Continue with the next command. Ask yourself what that command changed before moving on.`)
      }else{
        if(typeof S!=='undefined'&&S.mistakes){S.mistakes.push({q:'Terminal: '+currentLab()[1],a:cmd,correct:want,when:Date.now()});if(typeof save==='function')save();}
        paint('bad',`<b>✗ Not quite.</b> That command does not match the next required step. Think about the task’s exact goal and which utility performs that operation. Your terminal state is preserved.<br><button onclick="showTerminalHint()" style="margin-top:8px;padding:6px 9px;border-radius:9px;border:1px solid #31506d;background:#13243a;color:#fff">Show a small hint</button>`)
      }
    }
  }

  const oldTerminalBox=terminalBox;
  terminalBox=function(){return oldTerminalBox()+`<div id="termgrade" style="margin-top:9px;padding:10px;border-radius:10px;border:1px solid #31506d;background:#0a1725;color:#bfd2df;font-size:12px;line-height:1.55"></div>`};
  const oldRunLine=runLine;
  runLine=function(line){oldRunLine(line);gradeSubmitted(line)};
  window.runLine=runLine;

  const oldPractice=practice;
  practice=function(){resetGrader();oldPractice();setTimeout(resetGrader,0)};

  // Require the learner's explanation, then provide a full model explanation instead of immediately moving on.
  finishLab=function(){
    if(typeof page!=='undefined'&&page==='practice'&&!labDone){const m=document.getElementById('labmsg');if(m)m.innerHTML='<p style="color:var(--red)"><b>Complete the terminal task correctly before continuing.</b></p>';paint('bad','<b>✗ Terminal task incomplete.</b> Finish the required command sequence first.');return}
    const l=currentLab();
    const box=document.getElementById('explain');
    const e=box?box.value.trim():'';
    if(e.length<12){const m=document.getElementById('labmsg');if(m)m.innerHTML='<p style="color:var(--amber)"><b>Explain what happened and why in at least a short sentence.</b> Describe what the key command or option actually did.</p>';return}
    completeCurrentLab();
    if(typeof S!=='undefined'){
      S.labExplanations=S.labExplanations||{};
      S.labExplanations['mixed-'+labI]=e;
      if(typeof save==='function')save();
    }
    const m=document.getElementById('labmsg');
    if(m)m.innerHTML=`<div class="notice" style="line-height:1.6"><b>Your explanation</b><p>${h(e)}</p><hr style="border:0;border-top:1px solid #31506d"><b>Detailed model explanation</b><p>${labDetail(l)}</p><p><b>Expected command sequence:</b> <code>${h(l[2])}</code></p><button class="btn primary" onclick="nextMixedLab()">Next hands-on task</button></div>`;
  };
  window.finishLab=finishLab;
  window.nextMixedLab=function(){labI++;practice()};

  // Replace terse multiple-choice feedback with a complete rationale, including why every distractor is wrong.
  answerQ=function(el,a){
    const q=Q[qI%Q.length];
    const ok=a===q[2];
    if(typeof S!=='undefined'){
      S.quiz.total++;
      if(ok){S.quiz.right++;S.done[q[3]]=1}else S.mistakes.push({q:q[0],a,correct:q[2],when:Date.now()});
      if(typeof save==='function')save();
    }
    document.querySelectorAll('.choice').forEach(b=>b.disabled=true);
    el.classList.add(ok?'right':'wrong');
    const d=QUESTION_EXPLANATIONS[q[0]]||{why:`The correct answer is <code>${h(q[2])}</code>.`,wrong:{},demo:''};
    const wrongs=q[1].filter(c=>c!==q[2]).map(c=>`<li><b>${h(c)}:</b> ${d.wrong&&d.wrong[c]?d.wrong[c]:'It does not perform the operation described by this question.'}</li>`).join('');
    const msg=document.getElementById('qmsg');
    if(msg)msg.innerHTML=`<div class="notice" style="line-height:1.6;margin-top:10px"><h3 style="margin-top:0;color:${ok?'var(--green)':'var(--red)'}">${ok?'✓ Correct':'✗ Incorrect'}</h3><p><b>Correct answer: <code>${h(q[2])}</code></b></p><p><b>Why:</b> ${d.why}</p><p><b>Why the other choices are wrong:</b></p><ul>${wrongs}</ul>${d.demo?`<p><b>Recreate it in the terminal:</b> ${d.demo}</p>`:''}<p class="muted small">Objective ${h(q[3])}. Do not move on until you can explain the distinction without looking.</p><button class="btn primary" onclick="nextDetailedQuestion()">Next question</button></div>`;
  };
  window.answerQ=answerQ;
  window.nextDetailedQuestion=function(){qI++;practice()};

  // Flashcards now include explanation/context after the answer, not just a one-line fact.
  cards=function(){
    let dueIdx=F.map((_,i)=>i).filter(i=>!S.cards[i]||S.cards[i].due<=Date.now());
    if(!dueIdx.length)dueIdx=F.map((_,i)=>i);
    cardI=dueIdx[cardI%dueIdx.length];
    const f=F[cardI];
    const context=CARD_CONTEXT[f[2]]||'Connect this fact to the objective and practice it in the terminal when it can be demonstrated.';
    const example=CARD_EXAMPLES[f[0]]||'';
    V.innerHTML=`<h2>Spaced repetition</h2><div class="card"><div class="space"><span class="pill">Objective ${h(f[2])}</span><span class="muted small">${due()} due</span></div><div class="flash" onclick="flipCard()">${flip?h(f[1]):h(f[0])}</div><p class="muted small" style="text-align:center">Tap card to flip</p>${flip?`<div class="notice" style="line-height:1.6"><b>Detailed explanation</b><p>${h(f[1])}</p><p>${context}</p>${example?`<p><b>Example / connection:</b> ${example}</p>`:''}</div><div class="row" style="justify-content:center;margin-top:12px"><button class="btn danger" onclick="rate(0)">Again</button><button class="btn" onclick="rate(1)">Hard</button><button class="btn primary" onclick="rate(2)">Good</button><button class="btn" onclick="rate(3)">Easy</button></div>`:''}</div>`
  };

  term=function(){
    const l=currentLab();
    V.innerHTML=`<h2>Terminal Lab</h2><div class="card"><div class="space"><span class="pill">Objective ${l[0]}</span><span class="muted small">Challenge ${(freeLabIndex%LAB.length)+1}/${LAB.length}</span></div><h3>Task</h3><p>${l[1]}</p><p class="muted small">Write the commands from memory. You will get immediate right/wrong feedback. When you complete the task, the trainer explains every command and why it was used.</p>${terminalBox()}<div class="row" style="margin-top:10px"><button class="btn" onclick="showTerminalHint()">Small hint</button><button class="btn" onclick="runLine('man '+(splitExpected()[Math.min(labStep,splitExpected().length-1)]||'ls').split(/\s+/)[0])">Check man page</button></div></div>`;
    setTimeout(()=>{bindTerm();resetGrader()},0)
  };
  window.nextTerminalChallenge=function(){freeLabIndex=(freeLabIndex+1)%LAB.length;localStorage.setItem('lpi_terminal_lab_index',String(freeLabIndex));term()};

  const oldGo=go;
  go=function(p){oldGo(p);if(p==='practice')setTimeout(resetGrader,0)};
  window.go=go;
})();
