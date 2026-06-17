/* 深A女性向大学 — 站点脚本 */
(function(){
  'use strict';

  /* ---------- 星座 → 元素学院 ---------- */
  var SIGNS=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
  var ELEM={白羊:'火',狮子:'火',射手:'火',金牛:'土',处女:'土',摩羯:'土',
            双子:'风',天秤:'风',水瓶:'风',巨蟹:'水',天蝎:'水',双鱼:'水'};
  var HOUSE={
    火:{name:'火象学院',en:'HOUSE OF FIRE',color:'#C0453E',quote:'爱要爱得轰轰烈烈，听就听最上头的。',line:'上头第一，矜持第二。'},
    土:{name:'土象学院',en:'HOUSE OF EARTH',color:'#5C6E3A',quote:'音质细节差一点都不行，品质控的极致享受。',line:'挑剔到底，将就不了。'},
    风:{name:'风象学院',en:'HOUSE OF AIR',color:'#2D7E8E',quote:'嗑 CP 当学问，什么新玩法都想试。',line:'样样都尝，CP 比正主还熟。'},
    水:{name:'水象学院',en:'HOUSE OF WATER',color:'#3F4F9E',quote:'为情节沦陷，收藏夹深不见底。',line:'白天清水，深夜深海。'}
  };

  /* ---------- 存图 ---------- */
  function saveCard(card,filename){
    if(typeof html2canvas==='undefined'){alert('图片库还在加载，稍等再点');return;}
    card.classList.add('shoot');
    var bg=getComputedStyle(card).backgroundColor||'#F5F1EA';
    html2canvas(card,{scale:2,backgroundColor:bg,useCORS:true,logging:false}).then(function(cv){
      card.classList.remove('shoot');
      var a=document.createElement('a');a.download=filename;a.href=cv.toDataURL('image/png');a.click();
    }).catch(function(){card.classList.remove('shoot');alert('生成失败，再试一次');});
  }
  function rnd(){return Math.floor(1000+Math.random()*9000);}

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
    var sel=root.querySelector('[data-sort=sign]');
    SIGNS.forEach(function(s){sel.appendChild(new Option(s+'座',s));});
    var sorted=false;
    function run(){
      var s=sel.value,el=ELEM[s],h=HOUSE[el];
      root.querySelector('[data-dorm=hd]').style.background=h.color;
      var cr=root.querySelector('[data-dorm=crest]');cr.style.background=h.color;cr.textContent=el;
      root.querySelector('[data-dorm=house]').textContent=h.name;
      root.querySelector('[data-dorm=en]').textContent=h.en;
      root.querySelector('[data-dorm=sign]').textContent=s+'座';
      root.querySelector('[data-dorm=q]').textContent='“'+h.quote+'”';
      var ln=root.querySelector('[data-dorm=line]');ln.textContent=h.line;ln.style.color=h.color;
      sorted=true;
    }
    root.querySelector('[data-sort=go]').addEventListener('click',run);
    var sv=root.querySelector('[data-sort=save]');
    if(sv)sv.addEventListener('click',function(){if(!sorted)run();saveCard(root.querySelector('.dorm'),'深A女性向大学-分院结果.png');});
  }

  /* ---------- 入学申请表 ---------- */
  function initApply(root){
    wirePills(root,'dept');wirePills(root,'tone');
    var stars=root.querySelectorAll('.star');
    stars.forEach(function(s,i){s.addEventListener('click',function(){stars.forEach(function(x,j){x.classList.toggle('on',j<=i);});});});
    var ck=root.querySelector('[data-ck]');
    if(ck)ck.addEventListener('click',function(){ck.classList.toggle('on');ck.innerHTML=ck.classList.contains('on')?'<i class="ti ti-check"></i>':'';});
    function no(){root.querySelector('[data-no]').textContent='No. VS-MMXXVI-♀-'+rnd();}
    no();
    root.querySelector('[data-save]').addEventListener('click',function(){saveCard(root.querySelector('.gen-card'),'深A女性向大学-入学申请表.png');});
    root.querySelector('[data-reset]').addEventListener('click',function(){
      root.querySelectorAll('[contenteditable]').forEach(function(e){e.textContent='';});
      root.querySelectorAll('.on').forEach(function(e){e.classList.remove('on');});
      if(ck)ck.innerHTML='';no();
    });
  }

  /* ---------- 录取通知书 ---------- */
  function initOffer(root){
    wirePills(root,'odept',function(v){root.querySelector('[data-odept]').textContent=v;});
    function no(){root.querySelector('[data-ono]').textContent='录取字第 '+rnd()+' 号';}
    no();
    root.querySelector('[data-save]').addEventListener('click',function(){saveCard(root.querySelector('.gen-card'),'深A女性向大学-录取通知书.png');});
    root.querySelector('[data-reset]').addEventListener('click',function(){
      root.querySelectorAll('[contenteditable]').forEach(function(e){e.textContent='';});no();
    });
  }

  /* ---------- 校园动态 ---------- */
  function renderNews(){
    var list=document.getElementById('news-list');
    if(!list)return;
    fetch('content/news.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(data){
      var items=(data&&data.items)||[];
      if(!items.length){list.innerHTML='<div class="news-item"><span class="news-t" style="color:var(--muted)">暂无动态</span></div>';return;}
      list.innerHTML=items.map(function(n){
        var t=(n.title||'').replace(/</g,'&lt;');
        var dt=(n.date||'').replace(/</g,'&lt;');
        if(n.link){
          return '<a class="news-item link" href="'+n.link+'" target="_blank" rel="noopener"><span class="news-date">'+dt+'</span><span class="news-t">'+t+'<span class="news-ext">↗</span></span></a>';
        }
        return '<div class="news-item"><span class="news-date">'+dt+'</span><span class="news-t">'+t+'</span></div>';
      }).join('');
    }).catch(function(){list.innerHTML='<div class="news-item"><span class="news-t" style="color:var(--muted)">动态加载失败</span></div>';});
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded',function(){
    renderNews();
    document.querySelectorAll('[data-widget=sorting]').forEach(initSorting);
    var ap=document.querySelector('[data-widget=apply]');if(ap)initApply(ap);
    var of=document.querySelector('[data-widget=offer]');if(of)initOffer(of);
  });
})();
