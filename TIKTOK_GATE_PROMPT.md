انسخ هذا الطلب كما هو لأي مشروع Next.js/React:

أريدك تضيف TikTok Follow Gate مرة واحدة لكل جهاز قبل الوصول للقسم النهائي (قسم التصدير/المشاهدة).

المطلوب الوظيفي:
- أنشئ مكوّن عميل اسمه TikTokFollowGate يقبل children.
- عندما لا يكون المستخدم مفعلًا، اعرض children خلف Overlay مع blur-sm opacity-40 وامنع التفاعل.
- النص يجب يكون بسيط وواضح:
  - العنوان: المتابعة ضرورية للإكمال
  - الوصف: تابعنا على TikTok للإكمال ثم ارجع مباشرة
  - نص الزر: تابعنا على TikTok للإكمال
- لا تذكر أي اسم مستخدم في النص.
- عند الضغط على الزر:
  1) افتح الرابط في تبويب جديد مباشرة:
     https://www.tiktok.com/@irq.dv
  2) شغّل تحقق وهمي مدته 5 ثوانٍ تقريبًا بهذه الخطوات:
     - جاري فتح TikTok... (800ms)
     - التحقق من حسابك... (1400ms)
     - التحقق من المتابعة... (1600ms)
     - جاري تأكيد الاشتراك... (800ms)
     - تم التحقق بنجاح ✓ (400ms)
- استخدم requestAnimationFrame لتحريك:
  - Progress bar
  - Step dots
  - Circular SVG ring حتى 100%
- بعد النجاح انتظر 900ms ثم افتح المحتوى.
- خزّن حالة الفتح مرة واحدة لكل جهاز في localStorage بالمفتاح:
  tiktok_follow_done = "1"

تتبع قاعدة البيانات (Supabase):
- أنشئ جدول تتبع باسم tiktok_follow_events.
- يتم تسجيل المتابعة عند رجوع المستخدم للتبويب بعد الضغط على الزر (focus/visibilitychange).
- لا تسمح باحتساب الضغطة مرتين:
  - على الواجهة: localStorage key مثل tiktok_follow_counted
  - على قاعدة البيانات: UNIQUE(device_id)
- استخدم upsert على device_id.

SQL المطلوب إنشاؤه (ملف مستقل مثل tiktok-follow-setup.sql):
CREATE TABLE IF NOT EXISTS tiktok_follow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'birthday-site',
  account_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'followed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tiktok_follow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert follow events" ON tiktok_follow_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read follow events" ON tiktok_follow_events
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_tiktok_follow_events_created_at
  ON tiktok_follow_events(created_at DESC);

ملاحظات تنفيذ:
- استخدم framer-motion لدخول المودال وتبديل نص الخطوات.
- خلي التصميم نظيف وبسيط وجميل.
- طبّق الجيت عند الدخول للقسم الرابع النهائي (التصدير/المشاهدة).
- لا تكسر بقية المشروع، ولا تغيّر سلوك غير متعلق بالمطلوب.
