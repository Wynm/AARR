#!/usr/bin/env node
// AARR — تصدير العملاء المحتملين من Supabase إلى ملف CSV
// الاستعمال:
//   export SUPABASE_URL="https://rdendsijoowivydpvqho.supabase.co"
//   export SUPABASE_SERVICE_KEY="...(service_role)..."
//   node scripts/lead-export.mjs                 # ينشئ leads-YYYY-MM-DD.csv في المجلد الحالي
// ملاحظات: يؤثر فقط على قراءتك؛ لا يرسل شيئاً لأي جهة. لا تلتزم بالمفتاح الخدمي أبداً.
import { writeFile } from "node:fs/promises";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error("الخطأ: اضبط متغيري البيئة SUPABASE_URL و SUPABASE_SERVICE_KEY أولاً.");
  process.exit(1);
}
const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/leads?select=created_at,full_name,email,whatsapp,source,consent,utm_source,utm_medium,utm_campaign&order=created_at.desc`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` }
});
if (!res.ok) {
  console.error("فشل الاتصال بـ Supabase:", res.status, await res.text());
  process.exit(1);
}
const rows = await res.json();
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const header = ["created_at","full_name","email","whatsapp","source","consent","utm_source","utm_medium","utm_campaign"];
const lines = [header.join(","), ...rows.map(r => header.map(h => esc(r[h])).join(","))];
const file = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
await writeFile(file, "﻿" + lines.join("\r\n"), "utf8");
console.log(`تم تصدير ${rows.length} سجل إلى ${file}`);
