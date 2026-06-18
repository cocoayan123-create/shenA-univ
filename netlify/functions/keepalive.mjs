// Netlify 定时函数 — 每 3 天 ping 一次 Supabase，防止免费项目因 7 天无活动被暂停。
// 随站点一起部署，无需 GitHub workflow 权限。anon key 是公开的，硬编码即可。
export const config = { schedule: "0 6 */3 * *" };

const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyemtoenVxY29zZGVxYW5xZ3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDYwNzMsImV4cCI6MjA5NzMyMjA3M30.FSEne0MdCTWn6JSnqOCLMnUMwOpx9gLbIPs_AKvGh_Y";

export default async () => {
  try {
    await fetch("https://erzkhzuqcosdeqanqgwl.supabase.co/rest/v1/rpc/course_stats", {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cid: "keepalive" }),
    });
  } catch (e) {}
  return new Response("supabase pinged");
};
