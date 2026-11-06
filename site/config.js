// AARR — إعدادات عامة للواجهة (آمنة للنشر)
// المفتاح أدناه هو مفتاح Supabase "anon" المُصمم ليكون علنياً، وجداول قاعدة البيانات
// محمية بسياسات RLS: يمكنه فقط إضافة صفوف جديدة إلى جدول leads (بشرط الموافقة)،
// وقراءة جدول products. لا يمكنه قراءة أو تعديل أي شيء آخر.
// الأسرار الحقيقية (service_role / db_pass) لا توضع هنا أبداً — تُحفظ كأسرار بيئة فقط.
window.AARR_CONFIG = {
  supabaseUrl: "https://rdendsijoowivydpvqho.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZW5kc2lqb293aXZ5ZHB2cWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MzA0OTgsImV4cCI6MjEwOTUwNjQ5OH0.10g6kculQN91EC_OY0i1lSSaGQOTf85x84bs180Fw9M",

  // رابط الدفع: ضع هنا رابط Payhip أو Gumroad أو CMI الخاص بك لتفعيل الزر.
  // اتركه فارغاً — سيعرض الموقع تلقائياً خيار "سجّل الآن وستصلك الدعوة للشراء أولاً".
  buyUrl: "",

  productPriceMAD: 99,
  productName: "حزمة الذكاء الاصطناعي للمستقل المغربي",
  supportEmail: "s.elghribi@edu.umi.ac.ma",
  brand: "AARR",
  brandAr: "آفاق الربح الرقمي",
  version: "1.0.0"
};
