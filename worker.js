// 深A女性向大学 — Cloudflare Worker 入口
//
// 静态资源由 Cloudflare 资源层「优先」服务：所有页面（index.html / apply.html …）
// 仍按原来的干净 URL（html_handling 默认 auto-trailing-slash）直接命中，不经过这里。
// 本脚本只做两件事：
//   1) fetch：兜底极少数未命中静态资源的请求，回退给资源层（保持行为不变）。
//   2) scheduled：每 3 天 cron ping 一次 Supabase，防止免费项目因 7 天无活动被暂停。
//      —— 这是原 Netlify 定时函数 netlify/functions/keepalive.mjs 的替代（已迁出 Netlify）。
//      anon key 是公开可见的，硬编码安全。

const SUPA = "https://erzkhzuqcosdeqanqgwl.supabase.co/rest/v1/rpc/course_stats";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyemtoenVxY29zZGVxYW5xZ3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDYwNzMsImV4cCI6MjA5NzMyMjA3M30.FSEne0MdCTWn6JSnqOCLMnUMwOpx9gLbIPs_AKvGh_Y";

export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      fetch(SUPA, {
        method: "POST",
        headers: {
          apikey: KEY,
          Authorization: "Bearer " + KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cid: "keepalive" }),
      }).catch(() => {})
    );
  },
};
