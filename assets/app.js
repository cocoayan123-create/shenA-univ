/* 深A女性向大学 — 站点脚本 */
(function(){
  'use strict';
  var I=window.SA_I18N||{};

  /* ---------- 星座 → 元素学院 ---------- */
  function getSign(m,d){var S=[['摩羯',1,19],['水瓶',2,18],['双鱼',3,20],['白羊',4,19],['金牛',5,20],['双子',6,21],['巨蟹',7,22],['狮子',8,22],['处女',9,22],['天秤',10,23],['天蝎',11,21],['射手',12,21]];return d<=S[m-1][2]?S[m-1][0]:S[m%12][0];}
  var ELEM={白羊:'火',狮子:'火',射手:'火',金牛:'土',处女:'土',摩羯:'土',
            双子:'风',天秤:'风',水瓶:'风',巨蟹:'水',天蝎:'水',双鱼:'水'};
  var HOUSE={
    火:{name:'火象学院',en:'HOUSE OF FIRE',color:'#C0453E',tag:'热烈 · 直球 · 占有欲',quote:'爱要爱得轰轰烈烈，听就听最上头的。'},
    土:{name:'土象学院',en:'HOUSE OF EARTH',color:'#5C6E3A',tag:'感官 · 考究 · 收藏控',quote:'音质细节差一点都不行，品质控的极致享受。'},
    风:{name:'风象学院',en:'HOUSE OF AIR',color:'#2D7E8E',tag:'好奇 · 思辨 · 博爱',quote:'嗑 CP 当学问，什么新玩法都想试。'},
    水:{name:'水象学院',en:'HOUSE OF WATER',color:'#3F4F9E',tag:'深情 · 沉浸 · 隐秘',quote:'为情节沦陷，收藏夹深不见底。'}
  };

  /* ---------- 存图（生成 +1，序号回填到卡片） ---------- */
  function pad(n){n=String(n);while(n.length<5)n='0'+n;return n;}
  function saveCard(card,filename,opts){
    if(typeof html2canvas==='undefined'){alert(I.libLoading||'图片库还在加载，稍等再点');return;}
    function shoot(){
      card.classList.add('shoot');
      var bg=getComputedStyle(card).backgroundColor||'#F5F1EA';
      html2canvas(card,{scale:2,backgroundColor:bg,useCORS:true,logging:false}).then(function(cv){
        card.classList.remove('shoot');
        var a=document.createElement('a');a.download=filename;a.href=cv.toDataURL('image/png');a.click();
        try{localStorage.setItem('sa_gen','1');}catch(e){}
      }).catch(function(){card.classList.remove('shoot');alert(I.genFail||'生成失败，再试一次');});
    }
    if(opts&&opts.kind&&window.SAGen){
      window.SAGen(opts.kind,function(seq,hrank){
        if(seq&&opts.serialEl&&opts.fmt){opts.serialEl.textContent=opts.fmt(seq);}
        if(hrank&&opts.houseEl&&opts.houseFmt){opts.houseEl.textContent=opts.houseFmt(hrank);}
        shoot();
      },{house:opts.house});
    }else shoot();
  }

  /* ---------- 单选胶囊 ---------- */
  function wirePills(scope,group,onPick){
    var pills=scope.querySelectorAll('[data-group="'+group+'"]');
    pills.forEach(function(p){p.addEventListener('click',function(){
      pills.forEach(function(x){x.classList.remove('on');});
      p.classList.add('on');
      if(onPick)onPick(p.getAttribute('data-val')||p.textContent.trim());
    });});
  }

  /* ---------- 生日分院 ---------- */
  function initSorting(root){
    var nick=root.querySelector('[data-sort=nick]'),ys=root.querySelector('[data-sort=y]'),ms=root.querySelector('[data-sort=m]'),ds=root.querySelector('[data-sort=d]');
    ys.appendChild(new Option(I.selYear||'出生年',''));var _maxBY=(new Date().getFullYear()-18);for(var y=_maxBY;y>=1940;y--)ys.appendChild(new Option(y,y));
    ms.appendChild(new Option(I.selMonth||'月',''));for(var mo=1;mo<=12;mo++)ms.appendChild(new Option(mo,mo));
    ds.appendChild(new Option(I.selDay||'日',''));for(var dd=1;dd<=31;dd++)ds.appendChild(new Option(dd,dd));
    var done=false,lastHouse='',lastHouseName='';
    function run(){
      var m=parseInt(ms.value,10),d=parseInt(ds.value,10);
      if(!m||!d){alert(I.pickDate||'先选一下出生月、日');return;}
      var nm=(nick.value||'').trim()||(I.freshman||'某位新生');
      var s=getSign(m,d),el=ELEM[s],h=(I.HOUSE&&I.HOUSE[el])||HOUSE[el];lastHouse=el;lastHouseName=h.name;
      var pool=(window.SA_LINES&&window.SA_LINES[el])||[h.quote];
      var line=pool[Math.floor(Math.random()*pool.length)];
      root.querySelector('[data-dorm=hd]').style.background=h.color;
      var cr=root.querySelector('[data-dorm=crest]');cr.style.background=h.color;cr.textContent=(I.crest&&I.crest[el])||el;
      root.querySelector('[data-dorm=house]').textContent=h.name;
      root.querySelector('[data-dorm=en]').textContent=h.en;
      root.querySelector('[data-dorm=sign]').textContent=(I.nickOpen!=null?I.nickOpen:'「')+nm+(I.nickClose!=null?I.nickClose:'」')+' · '+(ys.value?ys.value+'.':'')+m+'.'+d+' · '+(I.sign?(I.sign[s]||s):s+'座');
      root.querySelector('[data-dorm=q]').textContent=(I.quoteOpen||'“')+line+(I.quoteClose||'”');
      var ln=root.querySelector('[data-dorm=line]');ln.textContent=h.tag;ln.style.color=h.color;
      done=true;
    }
    root.querySelector('[data-sort=go]').addEventListener('click',run);
    var sv=root.querySelector('[data-sort=save]');
    if(sv)sv.addEventListener('click',function(){if(!done){run();}if(done)saveCard(root.querySelector('.dorm'),I.sortFile||'深A女性向大学-分院结果.png',{kind:'sorting',house:lastHouse,serialEl:root.querySelector('[data-dorm=no]'),fmt:function(s){return (I.stuPre||'深A · 第 ')+Number(s).toLocaleString()+(I.stuSuf||' 位学员');},houseEl:root.querySelector('[data-dorm=hrank]'),houseFmt:function(n){return lastHouseName+(I.rankMid||' · 第 ')+Number(n).toLocaleString()+(I.rankSuf||' 名');}});});
  }

  /* ---------- 各系对应的能力自评轴（非男喘不应填声线，按系切换技能维度） ---------- */
  var DEPT_SKILLS={
    '男喘系':{label:'声线类型自评',pick:'声线',rate:'气息功底',chips:['低哑','奶狗','痞坏','青年音','少年音','叔音','隐忍','破碎感']},
    'ASMR声控系':{label:'声控风格自评',pick:'声控风格',rate:'助眠功力',chips:['耳语','气声','啵啵音','掏耳','舔耳','哄睡','摸头杀','颅内高潮']},
    '声音工程系':{label:'技术工种自评',pick:'技术路线',rate:'技术硬度',chips:['录音','混音','降噪','双耳3D','母带','拟音','气息修音','配乐']},
    '实时陪伴系':{label:'陪伴人设自评',pick:'陪伴人设',rate:'临场分寸',chips:['男友感','小狗','死对头','禁欲系','痞帅','兄长','爹系','病娇']},
    'AI系':{label:'AI 路线自评',pick:'AI 流派',rate:'炼丹功力',chips:['声音克隆','RVC音色','AI变声','AI绘图','AI写文','调教Prompt','模型微调','自动化']},
    '台本创作系':{label:'擅长题材自评',pick:'擅长题材',rate:'笔力',chips:['四爱','粗口','狗男','全能','ABO','强强','年下','撩精']},
    '视觉设计系':{label:'视觉风格自评',pick:'视觉风格',rate:'审美功底',chips:['冷淡禁欲','性张力','暗黑','血色','破碎感','高级感','极简','复古胶片']},
    '运营系':{label:'运营专长自评',pick:'运营专长',rate:'操盘力',chips:['精准选题','标签玄学','涨粉','引流','防搬运','控评','接单','私域']},
    '理论鉴赏系':{label:'研究方向自评',pick:'研究方向',rate:'鉴赏功力',chips:['喘学','嗑学','拉片','声控心理','跨文化','声音美学','颅内成像','考据癖']}
  };

  /* ---------- 入学申请书（叙事体，选项嵌进正文） ---------- */
  function initApply(root){
    var card=root.querySelector('.gen-card');
    function setF(name,val){var l=root.querySelectorAll('[data-f="'+name+'"]');for(var i=0;i<l.length;i++)l[i].textContent=val;}
    var nick=root.querySelector('[data-in=nick]');
    function pushNick(){setF('nick',(nick.value||'').trim()||'　　　');}
    nick.addEventListener('input',pushNick);
    var st=root.querySelector('[data-in=statement]');
    if(st)st.addEventListener('input',function(){var v=(st.value||'').trim();var e=root.querySelector('[data-f=statement]');if(e)e.textContent=v?((I.statePre||'自述 ｜ ')+v):'';});
    var SKILLS=I.deptSkills||DEPT_SKILLS;
    var skillLab=root.querySelector('[data-skill-label]'),skillPills=root.querySelector('[data-skill-pills]'),rateLab=root.querySelector('[data-rate-label]');
    function wireTone(){root.querySelectorAll('[data-group="tone"]').forEach(function(p){p.addEventListener('click',function(){root.querySelectorAll('[data-group="tone"]').forEach(function(x){x.classList.remove('on');});p.classList.add('on');setF('tone',p.textContent.trim());});});}
    function applyDept(v){
      setF('dept',v);
      var sk=SKILLS[v];if(!sk){for(var k in SKILLS){sk=SKILLS[k];break;}}
      setF('pickword',sk.pick);setF('rateword',sk.rate);
      if(skillLab)skillLab.textContent=sk.label;
      if(rateLab)rateLab.textContent=sk.rate;
      if(skillPills){skillPills.innerHTML=sk.chips.map(function(c){return '<span class="ap-chip" data-group="tone">'+String(c).replace(/&/g,'&amp;')+'</span>';}).join('');wireTone();}
      setF('tone',I.toneDefault||'　　');
    }
    wirePills(root,'dept',applyDept);
    var stars=root.querySelectorAll('.ap-ctl .star');
    stars.forEach(function(s,i){s.addEventListener('click',function(){
      stars.forEach(function(x,j){x.classList.toggle('on',j<=i);});
      var n=i+1;setF('stars','★★★★★'.slice(0,n)+'☆☆☆☆☆'.slice(0,5-n));
    });});
    applyDept(I.deptDefault||'男喘系');setF('stars','☆☆☆☆☆');pushNick();
    root.querySelector('[data-save]').addEventListener('click',function(){
      if(!(nick.value||'').trim()){alert(I.applyNickAlert||'先填上你的昵称，再生成申请书');nick.focus();return;}
      saveCard(card,I.applyFile||'深A女性向大学-入学申请书.png',{kind:'apply',serialEl:root.querySelector('[data-no]'),fmt:function(s){return 'No. SA·MMXXVI·'+pad(s);}});
    });
    var rs=root.querySelector('[data-reset]');
    if(rs)rs.addEventListener('click',function(){
      nick.value='';if(st)st.value='';
      root.querySelectorAll('.ap-ctl .on').forEach(function(e){e.classList.remove('on');});
      var d0=root.querySelector('.ap-ctl [data-group=dept]');if(d0)d0.classList.add('on');
      applyDept(I.deptDefault||'男喘系');setF('stars','☆☆☆☆☆');setF('statement','');pushNick();
    });
  }

  /* ---------- 录取通知书 ---------- */
  function initOffer(root){
    wirePills(root,'odept',function(v){root.querySelector('[data-odept]').textContent=v;});
    root.querySelector('[data-save]').addEventListener('click',function(){
      var nm=root.querySelector('.ce');
      if(nm&&!nm.textContent.trim()){alert(I.offerNickAlert||'先填上你的昵称，再生成录取通知书');nm.focus();return;}
      saveCard(root.querySelector('.gen-card'),I.offerFile||'深A女性向大学-录取通知书.png',{kind:'offer',serialEl:root.querySelector('[data-ono]'),fmt:function(s){return (I.offerNoPre||'录取字第 ')+pad(s)+(I.offerNoSuf||' 号');}});
    });
    root.querySelector('[data-reset]').addEventListener('click',function(){root.querySelectorAll('[contenteditable]').forEach(function(e){e.textContent='';});});
  }

  /* ---------- 校园动态 ---------- */
  function renderNews(){
    var list=document.getElementById('news-list');
    if(!list)return;
    var tries=0;
    function paint(items){
      if(!items.length){list.innerHTML='<div class="news-item"><span class="news-t" style="color:var(--muted)">暂无动态</span></div>';return;}
      list.innerHTML=items.map(function(n){
        var t=(n.title||'').replace(/</g,'&lt;');
        var dt=(n.date||'').replace(/</g,'&lt;');
        if(n.link){
          return '<a class="news-item link" href="'+n.link+'" target="_blank" rel="noopener"><span class="news-date">'+dt+'</span><span class="news-t">'+t+'<span class="news-ext">↗</span></span></a>';
        }
        return '<div class="news-item"><span class="news-date">'+dt+'</span><span class="news-t">'+t+'</span></div>';
      }).join('');
    }
    function load(){
      tries++;
      fetch('/content/news.json').then(function(r){return r.json();}).then(function(data){paint((data&&data.items)||[]);}).catch(function(){
        if(tries<3){setTimeout(load,1000*tries);return;}
        list.innerHTML='<div class="news-item"><span class="news-t" style="color:var(--muted)">动态暂时没刷出来，网络好点再下拉刷新</span></div>';
      });
    }
    load();
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded',function(){
    renderNews();
    document.querySelectorAll('[data-widget=sorting]').forEach(initSorting);
    var ap=document.querySelector('[data-widget=apply]');if(ap)initApply(ap);
    var of=document.querySelector('[data-widget=offer]');if(of)initOffer(of);
  });
})();
