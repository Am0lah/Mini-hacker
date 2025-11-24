/* game.js
   Mini Hack — Terminal simulation
   - 6 levels
   - commands: help, scan, connect <ip>, crack, guess <char|word>, status, levels <n>, scoreboard, lang, clear, exit
   - skull animation shows inside terminal on success (5s)
   - bilingual (AR/EN) toggle
*/

// -------------------- إعداد النصوص ثنائية اللغة --------------------
const L = {
    en: {
      welcome: "Welcome to Mini Hack Type 'help'for commands: ",
      help: `Commands:
   help               - show list of help
   scan               - scan network
   connect <IP>           - connect to device
   crack              - start cracking password game
   status             - show status
   levels <1-6>       - change level
   scoreboard         - show saved scores
   lang               - toggle language
   clear              - clear screen
   exit               - reload (exit) 🚪
  `,
      foundDevices: "Devices found: 🔍 ",
      connected: "Connected to 🔌 ",
      noTarget: "No target in this level ℹ️ .",
      startCrack: "Starting password guessing 🔐 ...",
      winMsg: "CONGRATULATIONS 🎉 ! Password found:",
      loseMsg: "Failed to find password ⚠️ .",
      promptCancel: "Guess canceled.",
      enterGuess: level => `Level ${level} — enter a letter or full word:`,
      attemptsLeft: attempts => `Attempts left: ${attempts}`,
      savedScore: name => `Score saved for ${name}`,
      scoreboardTitle: "SCOREBOARD",
      emptyScores: "No scores yet.",
      langBtn: "AR / EN",
      scoreBtn: "Scores",
    },
    ar: {
      welcome: " .... مرحباً بك في الهاكر الصغير ",
      help: ` الأوامر المتاحة:
   help               - عرض المساعدة
   scan               - فحص الشبكة
   connect /IP        - الاتصال بجهاز
   crack              - كسر كلمة المرور
   status             - عرض الحالة
   levels             - المستوى الحالي
   scoreboard         - عرض الدرجات المحفوظة
   lang               - تبديل اللغة
   clear              - مسح الشاشة
   exit               - خروج
  `,
      foundDevices: " 🔍 : الأجهزة المكتشفة",
      connected: ":🔌 تم الاتصال بـ",
      noTarget: ". ℹ️ لا يوجد هدف في هذا المستوى.",
      startCrack: "`🔐 بدء تخمين كلمة المرور...",
      winMsg: "... تهانينا 🎉 ! تم كشف كلمة المرور:",
      loseMsg: "⚠️ فشل في كشف كلمة المرور.",
      promptCancel: "تم إلغاء التخمين.",
      enterGuess: level => `المستوى ${level} — اكتب حرفًا أو الكلمة كاملة:`,
      attemptsLeft: attempts => `المحاولات المتبقية: ${attempts}`,
      savedScore: name => `تم حفظ النتيجة  ${name}`,
      scoreboardTitle: "قائمة الدرجات",
      emptyScores: "لا توجد نتائج محفوظة.",
      langBtn: "AR / EN",
      scoreBtn: "الدرجات",
    }
  };
  
  // الحالة الافتراضية (لغة إنجليزية ثم يمكن التبديل)
  let lang = 'ar'; // اجعل الواجهة عربية افتراضيًا
  const t = () => L[lang];
  
  // -------------------- عناصر الواجهة --------------------
  const screen = document.getElementById('screen');
  const input = document.getElementById('cmdInput');
  const enterBtn = document.getElementById('enterBtn');
  const promptLabel = document.getElementById('promptLabel');
  const terminalTitle = document.getElementById('terminalTitle');
  const skull = document.getElementById('skull');
  const scoreBtn = document.getElementById('scoreBtn');
  const langBtn = document.getElementById('langBtn');
  const scoreModal = document.getElementById('scoreModal');
  
  // -------------------- بيانات اللعبة --------------------
  const devicesByLevel = {
    1: [{ip:'192.168.1.10', name:'web-server'}],
    2: [{ip:'10.0.0.5', name:'db-server'}],
    3: [{ip:'172.16.0.3', name:'secure-gateway'}],
    4: [{ip:'192.168.100.2', name:'control-host'}],
    5: [{ip:'10.1.5.9', name:'research-node'}],
    6: [{ip:'172.20.10.11', name:'core-backup'}]
  };
  
  // كلمات المرور سهلة → متوسطة لكل مستوى
  const passwordsByLevel = {
    1: 'welcome1',
    2: 'admin123',
    3: 'P@ssw0rd',
    4: 'Guard4',
    5: 'Research9',
    6: 'Backup2025'
  };
  
  // حالة الجلسة
  const state = {
    connected: false,
    target: null,
    level: 1,
    inGuessMode: false,
    secret: null,
    revealed: null,
    attemptsLeft: 0,
    guessed: new Set()
  };
  
  // -------------------- دوال مساعدة للنص على الشاشة --------------------
  function write(text, cls){
    const el = document.createElement('div');
    el.className = cls || '';
    el.textContent = text;
    screen.appendChild(el);
    screen.scrollTop = screen.scrollHeight;
  }
  function writeHtml(html, cls){
    const el = document.createElement('div');
    el.className = cls || '';
    el.innerHTML = html;
    screen.appendChild(el);
    screen.scrollTop = screen.scrollHeight;
  }
  function clearScreen(){
    screen.innerHTML = '';
  }
  
  // -------------------- دوال مساعدة للنص على الشاشة --------------------
function write(text, cls){
  const el = document.createElement('div');
  el.className = cls || '';
  el.textContent = text;
  screen.appendChild(el);
  screen.scrollTop = screen.scrollHeight;
}
function writeHtml(html, cls){
  const el = document.createElement('div');
  el.className = cls || '';
  el.innerHTML = html;
  screen.appendChild(el);
  screen.scrollTop = screen.scrollHeight;
}
function clearScreen(){
  screen.innerHTML = '';
}

function showBlinkCursor(){
  const el = document.createElement('span');
  el.className = 'blink-cursor';
  el.textContent = '█'; 
  screen.appendChild(el);
  screen.scrollTop = screen.scrollHeight;
}
  // -------------------- دفعة ترحيب --------------------
function showWelcome(){
  clearScreen();
  write(t().welcome);
  write(''); // سطر فاصل
}
showWelcome();

  // -------------------- أوامر التيرمنال --------------------
  function cmdHelp(){ writeHtml(`<pre>${t().help}</pre>`); }
  
  
  function cmdScan(){
    const list = devicesByLevel[state.level] || [];
    write(`${t().foundDevices}`);
    if(list.length === 0) write(t().noTarget);
    else list.forEach(d => write(` - ${d.ip}   (${d.name})`));
  }
  
  function cmdConnect(ip){
    const list = devicesByLevel[state.level] || [];
    const found = list.find(d => d.ip === ip);
    if(!found){
      write(t().noTarget);
      return;
    }
    state.connected = true;
    state.target = found;
    write(`${t().connected} ${found.ip} (${found.name})`);
  }
  
  function cmdStatus(){
    write(`level: ${state.level}`);
    write(`connected: ${state.connected ? 'yes' : 'no'}`);
    if(state.connected && state.target) write(`target: ${state.target.ip} (${state.target.name})`);
  }
  
  function cmdLevels(arg){
    if(!arg){ write(`current level: ${state.level}`); return; }
    const n = Number(arg);
    if(Number.isInteger(n) && n >=1 && n <=6){
      state.level = n;
      write(`level set to ${state.level}`);
    } else {
      write('choose level 1..6');
    }
  }
  
  
  // -------------------- لعبة التخمين --------------------
  function startCrack(){
    if(!state.connected){
      write(t().noTarget);
      return;
    }
    const secret = passwordsByLevel[state.level];
    if(!secret){ write(t().noTarget); return; }
  
    state.inGuessMode = true;
    state.secret = secret;
    state.revealed = Array.from(secret).map(ch => (['-','@','!','_','.'].includes(ch) ? ch : '_'));
    state.attemptsLeft = 8;
    state.guessed = new Set();
  
    write(t().startCrack);
    write(state.revealed.join(' ') + '   ' + t().attemptsLeft(state.attemptsLeft));
    // next inputs will be handled by guess handler
  }
  
  function handleGuessInput(raw){
    if(!state.inGuessMode) { write('[!] Not in guess mode. Use crack to start.'); return; }
    const g = raw.trim();
    if(g.length === 0){ write('[!] Empty guess.'); return; }
  
    if(g.length > 1){ // whole word guess
      if(g === state.secret){
        onWin();
      } else {
        state.attemptsLeft -= 2;
        write('[✖] Wrong word. -2 attempts.');
      }
    } else {
      const ch = g[0];
      if(state.guessed.has(ch)){
        write(`[i] Already guessed "${ch}".`);
      } else {
        state.guessed.add(ch);
        let matched = false;
        for(let i=0;i<state.secret.length;i++){
          if(state.secret[i].toLowerCase() === ch.toLowerCase()){
            state.revealed[i] = state.secret[i];
            matched = true;
          }
        }
        if(matched) write('[✓] Correct.');
        else { state.attemptsLeft--; write('[✖] Incorrect.'); }
      }
    }
  
    write(state.revealed.join(' ') + '   ' + t().attemptsLeft(state.attemptsLeft));
  
    if(state.revealed.join('') === state.secret) return onWin();
    if(state.attemptsLeft <= 0) return onLose();
  }

  // ======= اسم اللاعب: قراءة / حفظ بدون نافذة منبثقة =======

// عناصر الواجهة للحقل الجديد
const playerNameInput = document.getElementById('playerNameInput');
const saveNameBtn = document.getElementById('saveNameBtn');

// مفتاح التخزين
const PLAYER_NAME_KEY = 'miniHackPlayerName_v1';

// دالة للحصول على اسم اللاعب (ترجيح: قيمة الحقل -> localStorage -> اسم مولد)
function getPlayerNameOrGenerate(){
  // 1) إذا في قيمة في الحقل نصية غير فارغة استخدمها
  if(playerNameInput && playerNameInput.value && playerNameInput.value.trim() !== ''){
    const n = playerNameInput.value.trim();
    // خزنها للمرات القادمة
    localStorage.setItem(PLAYER_NAME_KEY, n);
    return n;
  }
  // 2) إذا موجود في localStorage استخدمه
  const stored = localStorage.getItem(PLAYER_NAME_KEY);
  if(stored && stored.trim() !== '') return stored;
  // 3) خلاف ذلك جنّر اسم تلقائي بدون نافذة منبثقة
  const rnd = Math.floor(Math.random()*9000) + 1000;
  const auto = `Player_${rnd}`;
  // خزّن الاسم المولد أيضاً حتى يكون ثابت لاحقاً
  localStorage.setItem(PLAYER_NAME_KEY, auto);
  return auto;
}

// حدث زر حفظ الاسم (اختياري)
if(saveNameBtn && playerNameInput){
  saveNameBtn.addEventListener('click', () => {
    const v = playerNameInput.value.trim();
    if(v){
      localStorage.setItem(PLAYER_NAME_KEY, v);
      // ممكن تعرض رسالة صغيرة داخل التيرمنال بدون نافذة
      write(`✓ ${ (lang === 'ar') ? 'تم حفظ الاسم:' : 'Name saved:' } ${v}`);
    } else {
      // لو حاب تترك الحقل فارغ نحذف القيمة المخزنة
      localStorage.removeItem(PLAYER_NAME_KEY);
      write((lang === 'ar') ? 'تم مسح الاسم المحفوظ.' : 'Saved name cleared.');
    }
  });
}
  
  function onWin(){
    write(`${t().winMsg} ${state.secret}`);
    // show skull inside terminal for 5 seconds
    showSkullForSeconds(5);
  
    // save score: simple formula: level * attemptsLeft * 10
    const score = (state.level * (state.attemptsLeft + 1) * 10);
    const name = getPlayerNameOrGenerate();
    saveScore({ name, score, level: state.level, date: new Date().toISOString() });
    write ( (lang === 'ar') ? 'تم حفظ النتيجة ${name}' : 'Score saved for ${name}');
  
    // advance level if not last
    if(state.level < 6) {
      state.level++;
      write(`Next level : ${state.level}`);
    } else {
      write(' Completed all levels ! 🏆');
    }
  
    // reset guess mode and connection
    state.inGuessMode = false;
    state.connected = false;
    state.target = null;
  }
  
  function onLose(){
    write(t().loseMsg);
    state.inGuessMode = false;
    state.connected = false;
    state.target = null;
  }
  
  // -------------------- سكوربورد (localStorage) --------------------
  const SCORE_KEY = 'miniHackScores_v1';
  function saveScore(record){
    const arr = JSON.parse(localStorage.getItem(SCORE_KEY) || '[]');
    arr.push(record);
    localStorage.setItem(SCORE_KEY, JSON.stringify(arr));
  }
  function getScores(){
    return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]');
  }
  function showScoreboard(){
    const arr = getScores();
    scoreModal.style.display = 'block';
    scoreModal.innerHTML = `<h3>${t().scoreboardTitle}</h3>`;
    if(arr.length === 0){
      scoreModal.innerHTML += `<div class="small-muted">${t().emptyScores}</div>`;
      return;
    }
    // sort desc
    arr.sort((a,b)=> b.score - a.score);
    const list = document.createElement('div');
    list.className = 'score-list';
    arr.forEach((r,i) => {
      const d = document.createElement('div');
      d.textContent = `${i+1}) ${r.name} — ${r.score} pts — lvl:${r.level}`;
      list.appendChild(d);
    });
    scoreModal.appendChild(list);
    // close on click outside
    setTimeout(()=> {
      document.addEventListener('click', onDocClickForModal);
    }, 50);
  }
  function onDocClickForModal(e){
    if(!scoreModal.contains(e.target) && e.target !== scoreBtn){
      scoreModal.style.display = 'none';
      document.removeEventListener('click', onDocClickForModal);
    }
  }
  
  // -------------------- جمجمة عرض داخل التيرمنال --------------------
  function showSkullForSeconds(sec){
    if(!skull) return;
    skull.classList.remove('skull-show');
    // force reflow
    void skull.offsetWidth;
    skull.classList.add('skull-show');
    // hide after sec seconds
    setTimeout(()=> {
      skull.classList.remove('skull-show');
    }, sec * 1000);
  }
  
  // -------------------- معالجة أوامر المستخدم (المدخل) --------------------
  function processCommand(raw){
    const line = raw.trim();
    if(line === '') return;
    writeHtml(`<span style="color:#6fd96b">mini$</span> ${escapeHtml(line)}`);
  
    // If in guess mode — direct guesses allowed (letters/words)
    // but also accept "guess ..." or other commands (user choice)
    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
  
    if(state.inGuessMode){
      // if command is explicit 'guess' use handler, else treat the whole line as guess (single char or word)
      if(cmd === 'guess'){
        const rest = parts.slice(1).join(' ');
        if(!rest) write('[!] usage: guess <char|word>');
        else handleGuessInput(rest);
        return;
      }
      // allow help/clear even in guess mode
      if(cmd === 'help' || cmd === 'clear') {
        // fall through to normal handler
      } else {
        // treat as guess
        handleGuessInput(line);
        return;
      }
    }
  
    // Normal commands
    switch(cmd){
      case 'help':
        cmdHelp(); break;
      case 'scan':
        cmdScan(); break;
      case 'connect':
        if(parts.length<2) write('[!] usage: connect <IP>');
        else cmdConnect(parts[1]); break;
      case 'crack':
        if(!state.connected) {
          write(t().noTarget);
        } else startCrack();
        break;
      case 'guess':
        if(parts.length<2) write('[!] usage: guess <char|word>');
        else handleGuessInput(parts.slice(1).join(' '));
        break;
      case 'status':
        cmdStatus(); break;
      case 'levels':
        cmdLevels(parts[1]); break;
      case 'scoreboard':
      case 'scores':
        showScoreboard(); break;
      case 'lang':
        toggleLang(); break;
      case 'clear':
        clearScreen(); break;
      case 'exit':
        location.reload(); break;
      default:
        write('[!] Unknown command. Type help.'); break;
    }
  }
  
  // -------------------- أدوات مساعدة --------------------
  function escapeHtml(s){
    return s.replace(/[&<>"']/g, function(m){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }
  
  // -------------------- أحداث الواجهة --------------------
  enterBtn.addEventListener('click', ()=> {
    const val = input.value;
    input.value = '';
    processCommand(val);
    input.focus();
  });
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ enterBtn.click(); e.preventDefault(); }
  });
  
  // top buttons
  scoreBtn.addEventListener('click', ()=> showScoreboard());
  langBtn.addEventListener('click', ()=> toggleLang());
  
  // keyboard focus
  screen.addEventListener('click', ()=> input.focus());
  
  // -------------------- تبديل اللغة --------------------
  function toggleLang(){
    lang = (lang === 'ar') ? 'en' : 'ar';
    // update static UI text
    langBtn.textContent = L[lang].langBtn || 'AR/EN';
    scoreBtn.textContent = (lang === 'ar') ? 'الدرجات' : 'Scores';
    terminalTitle.textContent = (lang === 'ar') ? 'لعبة Mini Hack - الهاكر الصغير - تعليمي فقط' : 'Mini Hack - small hacker - educational';
    // show welcome in chosen lang
    showWelcome();
  }
  
  // Initialize labels
  langBtn.textContent = L[lang].langBtn;
  scoreBtn.textContent = (lang === 'ar') ? 'الدرجات' : 'Scores';
  terminalTitle.textContent = (lang === 'ar') ? 'لعبة Mini Hack - الهاكر الصغير - تعليمي فقط' : 'Mini Hack - small hacker - educational';
  
  // -------------- نهاية الملف --------------