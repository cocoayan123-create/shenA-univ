/* 深A女性向大学 — 课程互动（Supabase 直连，公开 anon key + RLS 兜底） */
(function(){
  'use strict';
  var BASE='https://erzkhzuqcosdeqanqgwl.supabase.co/rest/v1/';
  var KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyemtoenVxY29zZGVxYW5xZ3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDYwNzMsImV4cCI6MjA5NzMyMjA3M30.FSEne0MdCTWn6JSnqOCLMnUMwOpx9gLbIPs_AKvGh_Y';

  function H(extra){var h={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};if(extra)for(var k in extra)h[k]=extra[k];return h;}
  function ls(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function anonId(){var v=ls('sa_anon');if(!v){v='a'+Math.random().toString(36).slice(2)+Date.now().toString(36);lsSet('sa_anon',v);}return v;}
  function hasGen(){return ls('sa_gen')==='1';}
  function esc(s){return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function fmtDate(iso){try{var d=new Date(iso),p=function(n){return(n<10?'0':'')+n;};return (d.getMonth()+1)+'.'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());}catch(e){return '';}}

  function stats(cid){return fetch(BASE+'rpc/course_stats',{method:'POST',headers:H(),body:JSON.stringify({cid:cid})}).then(function(r){return r.json();}).then(function(d){return (d&&d[0])||{checkin_count:0,comment_count:0,rating_count:0,rating_avg:null};});}
  function checkin(cid){return fetch(BASE+'checkins?on_conflict=course_id,anon_id',{method:'POST',headers:H({Prefer:'resolution=ignore-duplicates,return=minimal'}),body:JSON.stringify({course_id:cid,anon_id:anonId()})});}
  function rate(cid,stars){return fetch(BASE+'ratings?on_conflict=course_id,anon_id',{method:'POST',headers:H({Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({course_id:cid,anon_id:anonId(),stars:stars})});}
  function getComments(cid){return fetch(BASE+'comments?select=body,created_at&course_id=eq.'+encodeURIComponent(cid)+'&order=created_at.desc&limit=200',{headers:H()}).then(function(r){return r.json();});}
  function postComment(cid,body){return fetch(BASE+'comments',{method:'POST',headers:H({Prefer:'return=minimal'}),body:JSON.stringify({course_id:cid,body:body,anon_id:anonId()})});}

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
      cs.forEach(function(c){
        if(!isLive(c))return;
        var m=el.querySelector('[data-meta="'+c.id+'"]');if(!m)return;
        stats(c.id).then(function(s){
          m.innerHTML='<i class="ti ti-flame"></i> '+s.checkin_count+' 打卡　<i class="ti ti-star"></i> '+(s.rating_avg!=null?s.rating_avg+'（'+s.rating_count+'）':'暂无评分');
        }).catch(function(){m.textContent='';});
      });
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
    refresh();paintComments();
    setInterval(function(){refresh();paintComments();},60000);
  }

  /* ---------- 生成计数（每次出图 +1，在册学员 = 生成总数） ---------- */
  function gen(kind,cb){
    fetch(BASE+'generations?select=seq',{method:'POST',headers:H({Prefer:'return=representation'}),body:JSON.stringify({kind:kind||'gen',anon_id:anonId()})})
      .then(function(r){return r.json();})
      .then(function(rows){
        var seq=(rows&&rows[0]&&rows[0].seq)||null;
        if(seq){var el=document.querySelector('[data-enrolled]');if(el)el.textContent=Number(seq).toLocaleString();}
        if(cb)cb(seq);
      }).catch(function(){if(cb)cb(null);});
  }
  window.SAGen=gen;
  function fillEnrolled(){
    var el=document.querySelector('[data-enrolled]');if(!el)return;
    fetch(BASE+'rpc/gen_count',{method:'POST',headers:H(),body:'{}'}).then(function(r){return r.json();}).then(function(n){
      if(typeof n==='number')el.textContent=Number(n).toLocaleString();
    }).catch(function(){});
  }

  document.addEventListener('DOMContentLoaded',function(){
    fillEnrolled();setInterval(fillEnrolled,60000);
    var list=document.getElementById('course-list');if(list)renderList(list);
    var root=document.getElementById('course-root');if(root)renderDetail(root);
  });
})();
