/* 深A女性向大学 — 课程互动（同域 /api/*，后端 Cloudflare D1，国内可达无需 VPN） */
(function(){
  'use strict';
  var API='/api/';
  function postJSON(path,obj){return fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj||{})});}
  function ls(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function anonId(){var v=ls('sa_anon');if(!v){v='a'+Math.random().toString(36).slice(2)+Date.now().toString(36);lsSet('sa_anon',v);}return v;}
  function hasGen(){return ls('sa_gen')==='1';}
  function esc(s){return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function fmtDate(iso){try{var d=new Date(iso),p=function(n){return(n<10?'0':'')+n;};return (d.getMonth()+1)+'.'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());}catch(e){return '';}}

  /* ---------- 实时同步：可见时每 POLL 拉一次，切回标签页/聚焦立即刷新 ---------- */
  var POLL=7000;
  function livePoll(fn){
    fn();
    setInterval(function(){if(!document.hidden)fn();},POLL);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)fn();});
    window.addEventListener('focus',function(){fn();});
  }
  /* 在册学员：数值变化时做一段缓动跳数，肉眼可见「在涨」 */
  function setEnrolled(n){
    var el=document.querySelector('[data-enrolled]');if(!el)return;
    n=Number(n)||0;
    var cur=parseInt(el.getAttribute('data-val')||'0',10)||0;
    el.setAttribute('data-val',n);
    if(n===cur){el.textContent=n.toLocaleString();return;}
    var start=cur,diff=n-start,t0=null,dur=Math.min(1400,300+Math.abs(diff)*30);
    function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/dur);var e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;el.textContent=Math.round(start+diff*e).toLocaleString();if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  }

  function stats(cid){return postJSON('stats',{cid:cid}).then(function(r){return r.json();}).then(function(d){return d||{checkin_count:0,comment_count:0,rating_count:0,rating_avg:null};});}
  function checkin(cid){return postJSON('checkin',{course_id:cid,anon_id:anonId()});}
  function rate(cid,stars){return postJSON('rate',{course_id:cid,anon_id:anonId(),stars:stars});}
  function getComments(cid){return fetch(API+'comments?cid='+encodeURIComponent(cid)).then(function(r){return r.json();});}
  function postComment(cid,body){return postJSON('comment',{course_id:cid,body:body,anon_id:anonId()});}

  function loadCourses(){return fetch('content/courses.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){return (d&&d.courses)||[];});}
  function isLive(c){return !!(c.x_link&&String(c.x_link).trim());}

  /* ---------- 列表（男喘系页） ---------- */
  function renderList(el){
    loadCourses().then(function(cs){
      el.innerHTML=cs.map(function(c){
        var live=isLive(c);
        return '<a class="crs-card'+(live?' live':'')+'" href="course.html?id='+encodeURIComponent(c.id)+'">'+
          '<div class="crs-card-top"><span class="crs-card-code">'+esc(c.code)+'</span>'+
          (live?'<span class="crs-badge live">开课中</span>':'<span class="crs-badge">待开课</span>')+'</div>'+
          '<div class="crs-card-title">'+esc(c.title)+'</div>'+
          '<div class="crs-card-meta" data-meta="'+esc(c.id)+'">'+(live?'…':'链接上线后开放打卡 / 评分')+'</div></a>';
      }).join('');
      function refreshStats(){
        cs.forEach(function(c){
          if(!isLive(c))return;
          var m=el.querySelector('[data-meta="'+c.id+'"]');if(!m)return;
          stats(c.id).then(function(s){
            m.innerHTML='<i class="ti ti-flame"></i> '+s.checkin_count+' 打卡　<i class="ti ti-star"></i> '+(s.rating_avg!=null?s.rating_avg+'（'+s.rating_count+'）':'暂无评分');
          }).catch(function(){});
        });
      }
      livePoll(refreshStats);
    }).catch(function(){el.innerHTML='<p style="color:var(--muted)">课程加载失败</p>';});
  }

  /* ---------- 详情（course.html） ---------- */
  function qid(){var m=location.search.match(/[?&]id=([^&]+)/);return m?decodeURIComponent(m[1]):'';}
  function renderDetail(root){
    var id=qid();
    loadCourses().then(function(cs){
      var c=null;for(var i=0;i<cs.length;i++){if(cs[i].id===id){c=cs[i];break;}}
      if(!c){root.innerHTML='<p style="color:var(--muted)">课程不存在。<a href="men-chuan.html">返回男喘系</a></p>';return;}
      document.title=c.title+' · 男喘系 · 深A女性向大学';
      var live=isLive(c),h='';
      h+='<div class="crs-d-code">'+esc(c.code)+'</div><h1 class="crs-d-title">'+esc(c.title)+'</h1>';
      h+=live?'<span class="crs-badge live">开课中</span>':'<span class="crs-badge">待开课</span>';
      h+='<div class="crs-sum"><div class="crs-sum-h"><i class="ti ti-sparkles"></i> AI 总结</div><p>'+esc(c.summary)+'</p></div>';
      if(live){
        h+='<a class="btn btn-purple crs-d-link" href="'+esc(c.x_link)+'" target="_blank" rel="noopener"><i class="ti ti-brand-x"></i> 去 X 看完整课程 <i class="ti ti-external-link"></i></a>';
        h+='<div class="crs-inter"><div data-ck></div><div data-rate></div></div>';
        h+='<div class="crs-cm"><div class="crs-cm-h">课程评论 <span data-cm-n></span></div>'+
          '<div class="crs-cm-form"><textarea data-cm-input maxlength="500" placeholder="匿名说点什么…（最多 500 字）"></textarea>'+
          '<button class="btn btn-purple" data-cm-send><i class="ti ti-send"></i> 发布</button></div>'+
          '<div class="crs-cm-list" data-cm-list>加载中…</div></div>';
      }else{
        h+='<div class="crs-upcoming"><i class="ti ti-clock"></i> 本课待开课。链接上线后即可打卡、评分、评论。敬请期待。</div>';
      }
      root.innerHTML=h;
      if(live)wireDetail(root,c);
    });
  }

  function wireDetail(root,c){
    var ckWrap=root.querySelector('[data-ck]'),rateWrap=root.querySelector('[data-rate]');
    var cmList=root.querySelector('[data-cm-list]'),cmN=root.querySelector('[data-cm-n]');

    function paintCk(n){
      if(!hasGen()){
        ckWrap.innerHTML='<button class="crs-ck-btn" disabled>打卡 · '+n+'</button><div class="crs-ck-hint">打卡需先生成一张图片 ·<a href="apply.html"> 去填一份报名表 </a>解锁</div>';
      }else if(ls('sa_ck_'+c.id)==='1'){
        ckWrap.innerHTML='<button class="crs-ck-btn done" disabled><i class="ti ti-check"></i> 已打卡 · '+n+'</button>';
      }else{
        ckWrap.innerHTML='<button class="crs-ck-btn">打卡 · '+n+'</button>';
        ckWrap.querySelector('button').addEventListener('click',function(){
          this.disabled=true;
          checkin(c.id).then(function(){lsSet('sa_ck_'+c.id,'1');refresh();}).catch(function(){alert('网络波动，再试一次');paintCk(n);});
        });
      }
    }
    function paintRate(avg,cnt){
      var mine=parseInt(ls('sa_rt_'+c.id)||'0',10),stars='';
      for(var i=1;i<=5;i++){stars+='<i class="ti ti-star crs-star'+(i<=mine?' on':'')+'" data-s="'+i+'"></i>';}
      rateWrap.innerHTML='<div class="crs-rate-h">评分（匿名）</div><div class="crs-stars">'+stars+'</div>'+
        '<div class="crs-rate-avg">'+(avg!=null?'<b>'+avg+'</b> / 5　'+cnt+' 人评':'还没人评分')+(mine?'　· 你打了 '+mine+' 星':'')+'</div>';
      rateWrap.querySelectorAll('.crs-star').forEach(function(st){
        st.addEventListener('click',function(){
          var v=parseInt(st.getAttribute('data-s'),10);
          rate(c.id,v).then(function(){lsSet('sa_rt_'+c.id,String(v));refresh();}).catch(function(){alert('网络波动，再试一次');});
        });
      });
    }
    function paintComments(){
      getComments(c.id).then(function(rows){
        cmN.textContent='· '+rows.length;
        cmList.innerHTML=rows.length?rows.map(function(r){
          return '<div class="crs-cm-item"><div class="crs-cm-body">'+esc(r.body)+'</div><div class="crs-cm-date">'+fmtDate(r.created_at)+'</div></div>';
        }).join(''):'<div class="crs-cm-empty">还没有评论，来当第一个。</div>';
      }).catch(function(){cmList.innerHTML='<div class="crs-cm-empty">评论加载失败</div>';});
    }
    var sendBtn=root.querySelector('[data-cm-send]'),input=root.querySelector('[data-cm-input]');
    sendBtn.addEventListener('click',function(){
      var t=(input.value||'').trim();
      if(t.length<1)return;
      if(t.length>500){alert('最多 500 字');return;}
      sendBtn.disabled=true;
      postComment(c.id,t).then(function(){input.value='';sendBtn.disabled=false;paintComments();}).catch(function(){sendBtn.disabled=false;alert('发送失败，再试一次');});
    });
    function refresh(){stats(c.id).then(function(s){paintCk(s.checkin_count);paintRate(s.rating_avg,s.rating_count);});}
    livePoll(function(){refresh();paintComments();});
  }

  /* ---------- 生成计数（每次出图 +1，在册学员 = 生成总数） ---------- */
  function gen(kind,cb,opts){
    var b={kind:kind||'gen',anon_id:anonId()};
    if(opts&&opts.house)b.house=opts.house;
    postJSON('gen',b)
      .then(function(r){return r.json();})
      .then(function(d){
        var seq=(d&&d.seq)||null;
        if(seq)setEnrolled(seq);
        if(cb)cb(seq,(d&&d.house_rank)||null);
      }).catch(function(){if(cb)cb(null,null);});
  }
  window.SAGen=gen;
  function fillEnrolled(){
    if(!document.querySelector('[data-enrolled]'))return;
    fetch(API+'gen_count').then(function(r){return r.json();}).then(function(n){
      if(typeof n==='number')setEnrolled(n);
    }).catch(function(){});
  }

  document.addEventListener('DOMContentLoaded',function(){
    var nt=document.querySelector('.nav-toggle'),nm=document.querySelector('nav.main');
    if(nt&&nm)nt.addEventListener('click',function(){var o=nm.classList.toggle('open');nt.setAttribute('aria-expanded',o?'true':'false');});
    livePoll(fillEnrolled);
    var list=document.getElementById('course-list');if(list)renderList(list);
    var root=document.getElementById('course-root');if(root)renderDetail(root);
  });
})();
