# UX/UI & System Improvement Plan — Thai-Lao Logistic
**วันที่วิเคราะห์: 24 เม.ย. 2569 · เวอร์ชัน 2.0 (Full Audit)**

---

## 1. โมเดลระบบ — ใครใช้และทำอะไร

ก่อนวิเคราะห์ UX ต้องเข้าใจก่อนว่าระบบนี้มีใครใช้:

```
Staff (พนักงาน)     → รับพัสดุ + สแกนอัพเดท + เก็บ COD
Manager (ผู้จัดการ) → ทุกอย่างของ Staff + ดูรายงาน + โอน COD
Admin (ผู้ดูแล)     → ทุกอย่างทุกสาขา + จัดการ Users
```

State machine พัสดุ (ยืนยันแล้ว 7 สถานะ):
```
received → in_transit → arrived → delivered
                                └→ failed_delivery → arrived (retry)
                                                  └→ returned
received → cancelled
```

**บริบทสำคัญ:** Staff คือผู้ใช้หลัก ใช้ทั้งมือถือและคอม  
Manager/Admin ส่วนใหญ่ใช้ desktop

---

## 2. ปัญหา Cross-Cutting (ส่งผลทุกหน้า — แก้ก่อน)

### 2.1 ขาดภาษาไทย
ระบบมีแค่ `en.json` + `lo.json` — Staff ฝั่งไทยต้องใช้ภาษาอังกฤษ  
i18n infrastructure พร้อมรองรับแล้ว ต้องเพิ่มแค่ `src/locales/th.json` + ลงทะเบียนใน `lib/i18n.tsx`

### 2.2 Roadmap Card บนหน้า Scan ยังคงอยู่
Card "Scan modes" แสดงข้อความ internal "Reserved for bulk handling after the exact lookup flow is fully stable"  
พนักงานเห็นข้อความนี้ทุกวัน ทำให้ระบบดูยังไม่เสร็จ

### 2.3 Icon-only Buttons ไม่มี Text Label
ปุ่มกล้องบนหน้า Scan มีแค่ `title` tooltip — บน mobile tooltip ไม่แสดง  
พนักงานไม่รู้ว่าปุ่มนี้ทำอะไร

### 2.4 สกุลเงิน THB/LAK ไม่ชัดเจนขณะกรอก
COD field ไม่แสดงหน่วยข้างๆ input — ต้องเดาว่า THB หรือ LAK

### 2.5 Topbar Mobile ซ้ำข้อมูลกับ Page Header
Topbar แสดงชื่อหน้า แต่ทุกหน้ายังมี `<h1>` ซ้ำอีกรอบ เสีย ~75px vertical space

---

## 3. การวิเคราะห์รายหน้า

### หน้า 1 — Dashboard (`/dashboard`)

**สภาพปัจจุบัน:** 4 stat cards, Quick actions (role-based), Flow board (4 สถานะ), Attention queue (arrived + failed_delivery), Recent shipments

| # | ปัญหา | ผลกระทบ |
|---|-------|---------|
| P2 | Flow board แสดงแค่ 4 สถานะจาก 7 — ขาด delivered, returned, cancelled | ผู้จัดการไม่เห็น pipeline สมบูรณ์ |
| P2 | Attention queue รวม `arrived` — ไม่ใช่ exception แต่เป็น normal flow | Queue ดู overloaded สับสนว่าต้องทำอะไร |
| P3 | Section heading ขัดแย้ง: metric-label="Quick actions" แต่ h2="Operations board" | Inconsistent |

**แนวทางแก้:**
1. Attention queue → เฉพาะ `failed_delivery` + `arrived` ที่ค้างนาน > 3 วัน (ตรวจด้วย `updatedAt`)
2. Flow board → เพิ่ม `delivered` (เขียว) + `returned` (เทา)
3. ใช้ชื่อ section เดียวกัน: เลือก "Quick actions" ทั้งหมด

---

### หน้า 2 — รายการพัสดุ (`/dashboard/shipments`)

**สภาพปัจจุบัน:** Sticky filter bar + 8 status tabs + card list (4 columns/card) + aside summary (xl only)

| # | ปัญหา | ผลกระทบ |
|---|-------|---------|
| P2 | Card 4 columns บน mobile ยุบเป็น 1 column → card สูงมาก | เห็น 1-2 รายการต่อหน้าจอ |
| P2 | Status tabs ไม่มี scroll indicator | ไม่รู้ว่า scroll ได้ มองไม่เห็น returned/cancelled |
| P3 | Pagination แสดงแค่ "Page X" ไม่มี total | ไม่รู้มีกี่หน้าทั้งหมด |

**แนวทางแก้:**
1. **Mobile compact card**: viewport < 768px → tracking + status + ชื่อผู้รับ + ราคา (2 rows) กด expand ดูรายละเอียด
2. **Scroll fade mask**: CSS gradient ขวามือบน tabs container บน mobile
3. **Pagination**: "หน้า 1 / 5 (98 รายการ)"

---

### หน้า 3 — สร้างพัสดุ (`/dashboard/shipments/new`) ★ Critical

**สภาพปัจจุบัน:**
- Layout: `xl:grid-cols-[1fr_aside]` — desktop 2 column, mobile stack
- 4 sections: Sender → Receiver → Route+Pricing → Package+Partner
- Aside (xl only): Preview + Submit button

| # | ปัญหา | ผลกระทบ |
|---|-------|---------|
| P1 | พิมพ์ชื่อ+เบอร์ผู้ส่ง/ผู้รับทุกครั้ง ไม่มี autocomplete | ช้า ผิดพลาดสูง |
| P1 | Submit button อยู่ใน aside (xl only) — mobile ต้อง scroll ผ่าน 4 sections | พนักงานหาปุ่มไม่เจอ |
| P1 | ไม่มี confirmation ก่อน submit บน mobile | Mistake-prone |
| P2 | Address field (Textarea) แสดงเสมอ กินพื้นที่ | Form ยาวเกิน |
| P2 | ไม่มี progress indicator | สับสนบนฟอร์มยาว |
| P2 | COD field ไม่แสดง currency | เสี่ยงผิดสกุลเงิน |
| P2 | priceType "Auto calculate" Staff ไม่เข้าใจว่าคำนวณจากอะไร | ต้องอธิบาย |

**แนวทางแก้:**

**A. Phone Lookup Autocomplete**
- พิมพ์เบอร์ ≥ 4 หลัก → debounce 300ms → query API
- ถ้าพบลูกค้าเก่า → dropdown suggestion → กดเลือก → fill ชื่อ + address
- ทำทั้ง sender และ receiver phone

**B. Sticky Submit Bar บน Mobile**
- viewport < 768px: fixed bottom bar + route summary + ปุ่ม Submit
- Desktop คงเลย์เอาต์เดิม (aside ขวา)

**C. Section Progress Indicator**
- step tabs 4 ขั้น ด้านบน form: `1 ผู้ส่ง → 2 ผู้รับ → 3 เส้นทาง → 4 พัสดุ`
- ยังเป็น single-page form ไม่ใช่ wizard (scroll ดูได้ทั้งหมด)

**D. Address Collapsible**
- ซ่อนโดย default — ปุ่ม `+ เพิ่มที่อยู่ (ไม่บังคับ)` กดแล้ว expand

**E. COD Currency Label**
- ดึงจาก originBranch ที่เลือก → แสดง "THB" หรือ "LAK" ข้าง input

---

### หน้า 4 — Scan & อัพเดทสถานะ (`/dashboard/scan`) ★ Critical

**สภาพปัจจุบัน:**
- ซ้าย: Search card (tracking input + camera toggle) → Update card (status form)
- ขวา: Quick links + "Scan modes" roadmap card
- หลัง save: `router.push('/dashboard/shipments/${id}')` — ออกจากหน้า scan

| # | ปัญหา | ผลกระทบ |
|---|-------|---------|
| P1 | หลัง scan+save ออกจากหน้า scan | Flow ขาด เสียเวลามาก |
| P1 | ปุ่มกล้องไม่มี text label — icon + title tooltip เท่านั้น | Mobile ไม่รู้ว่าทำอะไร |
| P1 | Roadmap card แสดงข้อมูล internal แก่พนักงาน | ดูไม่เสร็จ สับสน |
| P2 | ไม่มี Batch mode | Productivity ต่ำมากเมื่อมีหลายกล่อง |
| P2 | Status dropdown บน mobile เป็น native select | Touch UX แย่ |
| P2 | Terminal status แสดงแค่ "No further transitions" | ไม่รู้เหตุผล |

**แนวทางแก้:**

**A. Stay-on-page หลัง Save**
- หลัง save สำเร็จ → **ไม่** navigate ออก
- Reset form กลับ empty + toast "บันทึกสำเร็จ — [tracking]" พร้อม link "ดูรายละเอียด →"

**B. Camera Button + Text Label**
- desktop (sm+): icon-only เหมือนเดิม
- mobile (< sm): icon + text "สแกนกล้อง"

**C. ลบ Roadmap Card ออก**
- ลบ "Scan modes" card ทั้งหมด
- เมื่อ implement batch mode ใส่ toggle ตรงนั้นแทน

**D. Status Pill Buttons แทน Select (Mobile)**
- viewport < 768px: pill button group แนวนอน scroll ได้
- Desktop คง `<select>` เดิม

**E. Terminal Status Message**
- `nextStatuses.length === 0` → แสดง "พัสดุนี้ [X] แล้ว ไม่สามารถเปลี่ยนสถานะได้อีก"
- ปุ่ม Save disabled พร้อม tooltip

**F. Batch Scan Mode** — ดู Section 6

---

### หน้า 5 — COD (`/dashboard/cod`)

**สภาพปัจจุบัน:** Filter native select, 3 groups, inline collect form expand

| # | ปัญหา | ผลกระทบ |
|---|-------|---------|
| P2 | Filter select ≠ pill tabs ใน shipments | Visual language ไม่สม่ำเสมอ |
| P2 | Inline form expand → layout shift | น่ารำคาญ |
| P3 | 3 columns บน mobile | ต้อง scroll แนวนอน |

**แนวทางแก้:**
1. Filter → pill tabs (component เดียวกับ shipments)
2. Collect form → Sheet/Drawer (ใช้ `<Sheet>` ที่มีอยู่แล้ว)
3. Mobile → vertical stack + section divider

---

### หน้า 6 — รายงาน (`/dashboard/reports`)

| # | ปัญหา | ผลกระทบ |
|---|-------|---------|
| P3 | ไม่มี date range filter — all-time เสมอ | ไม่มีประโยชน์สำหรับ daily ops |
| P3 | Export hardcode `take: 500` | Report ไม่สมบูรณ์ถ้าพัสดุเกิน 500 |

**แนวทางแก้:**
1. Date range picker (ใช้ `<Calendar>` + `<Popover>` ที่มีอยู่แล้ว)
2. Export รับ dateFrom/dateTo params แทน hardcode

---

### หน้า 7 — Navigation

**สภาพปัจจุบัน:** Desktop sidebar + Topbar / Mobile Topbar + Bottom nav (4 items + More sheet)

| # | ปัญหา | ผลกระทบ |
|---|-------|---------|
| P2 | Topbar mobile ซ้ำชื่อหน้ากับ h1 | เสีย ~75px |
| P2 | Manager ต้องกด More เพื่อ Reports | เพิ่ม tap count |
| P3 | LocaleSwitcher ตำแหน่งต่างกัน desktop/mobile | หาไม่เจอ |

**แนวทางแก้:**
1. Topbar mobile: แสดงแค่ brand + branch name ไม่แสดงชื่อหน้าซ้ำ
2. Manager role: `mobilePrimary: true` บน Reports → ขึ้น bottom bar โดยตรง

---

## 4. Priority Table รวม 23 Items

| ID | หัวข้อ | หน้า | Priority | Effort |
|----|--------|------|----------|--------|
| UX-01 | เพิ่มภาษาไทย th.json | ทุกหน้า | **P0** | M |
| UX-02 | Stay-on-page หลัง scan save | Scan | **P0** | S |
| UX-03 | ลบ Roadmap card | Scan | **P0** | XS |
| UX-04 | Sticky Submit bar บน mobile | Create | **P1** | S |
| UX-05 | Phone lookup autocomplete | Create | **P1** | L |
| UX-06 | Camera button + text label | Scan | **P1** | XS |
| UX-07 | Compact card บน mobile | Shipments | **P1** | M |
| UX-08 | Address collapsible optional | Create | **P2** | S |
| UX-09 | Section progress indicator | Create | **P2** | S |
| UX-10 | COD currency label ข้าง input | Create | **P2** | XS |
| UX-11 | Status pill buttons แทน select (mobile) | Scan | **P2** | S |
| UX-12 | Terminal status message ชัดเจน | Scan | **P2** | XS |
| UX-13 | Batch scan mode | Scan | **P2** | XL |
| UX-14 | Status tabs scroll fade | Shipments | **P2** | XS |
| UX-15 | Attention queue เฉพาะ failed + stale | Dashboard | **P2** | S |
| UX-16 | Flow board เพิ่ม delivered + returned | Dashboard | **P3** | S |
| UX-17 | COD filter → pill tabs | COD | **P3** | S |
| UX-18 | COD collect form → Drawer | COD | **P3** | M |
| UX-19 | Reports date range filter | Reports | **P3** | M |
| UX-20 | Export ลบ hardcode take: 500 | Reports | **P3** | XS |
| UX-21 | Topbar mobile ลด duplication | Navigation | **P3** | XS |
| UX-22 | Manager mobile nav แสดง Reports โดยตรง | Navigation | **P3** | XS |
| UX-23 | Pagination แสดงจำนวนหน้าทั้งหมด | Shipments | **P3** | XS |

> Effort: XS < 30 นาที · S < 2 ชม. · M < 1 วัน · L < 2 วัน · XL > 2 วัน

---

## 5. API ใหม่ที่ต้องสร้าง

### 5.1 GET /api/v1/customers/lookup

```
Query:    ?phone=0812345678  (min 4 chars)
Auth:     withRole(['admin','manager','staff'])
Branch:   ไม่ scope branch
Response: 200 { firstname, lastname, address } | 204 ถ้าไม่พบ (ไม่ error)
Logic:    SELECT TOP 1 FROM Person WHERE phone LIKE :phone% ORDER BY updatedAt DESC
```

### 5.2 PATCH /api/v1/shipments/batch

```
Body:
  ids:      string[]          // 1–100 shipment IDs
  status:   ShipmentStatus
  location: string | undefined
  note:     string | undefined

Auth:   withRole(['admin','manager','staff'])
Scope:  shipmentBranchScope() ต่อ id

Response 200:
  {
    success: number,
    failed: Array<{
      id, trackingNo, currentStatus,
      reason: 'invalid_transition' | 'not_found' | 'branch_mismatch'
    }>
  }

Logic:
  1. Zod validate: ids length 1–100
  2. Loop: canTransition() → update + ShipmentEvent ใน transaction
  3. ล้มเหลว: เพิ่มใน failed (partial success ได้)
  4. AuditLog 1 record ต่อ batch operation
```

---

## 6. Batch Scan Mode — UX Flow

```
[Toggle: โหมดเดี่ยว | โหมดแบทช์]
         ↓
Setup Panel:
  - Transition target (เช่น → arrived)
  - Location (optional, ร่วมทั้ง batch)
  - Note (optional, ร่วมทั้ง batch)
  [เริ่มสแกน]
         ↓
Scan Loop:
  - scan สำเร็จ → queue +1 + beep + vibrate
  - scan ไม่ผ่าน → หยุด + error card
      [Dismiss] → scan ต่อ
      [หยุด Batch] → กลับ setup
  [ตรวจสอบและยืนยัน (N รายการ)]
         ↓
Preview Table:
  Tracking | ผู้รับ | สถานะเดิม → ใหม่
  [ยืนยัน N รายการ] / [แก้ไข]
         ↓
PATCH /api/v1/shipments/batch
         ↓
Summary: ✓ สำเร็จ X   ✗ ล้มเหลว Y
```

**กฎสำคัญ:** STOP ON ERROR — หยุดทันทีถ้า scan item ไม่ผ่าน ไม่ข้ามต่อ  
**กฎสำคัญ:** Preview ก่อน Confirm เสมอ — batch action ไม่ undoable

---

## 7. Production Items ที่ค้างอยู่ (ต้องทำก่อน go-live)

| งาน | ไฟล์ | วิธีทำ |
|-----|------|--------|
| HTTPS redirect | `nginx/nginx.conf` | Uncomment block + ติดตั้ง cert |
| HSTS header | `nginx/nginx.conf` | `add_header Strict-Transport-Security "max-age=31536000"` |
| CSP header | `nginx/nginx.conf` | `add_header Content-Security-Policy ...` |
| Run migration | terminal | `npx prisma migrate deploy` |
| Env จริง | `.env` | DB_PASSWORD + JWT_SECRET ห้ามใช้ default |

---

## 8. Playwright Test Plan

### หลักการ
- ทุก feature ใน plan ต้องมี test คู่กัน
- `tests/e2e/business.spec.ts` — feature tests
- `tests/e2e/app.spec.ts` — regression tests
- Mobile tests: `page.setViewportSize({ width: 390, height: 844 })`

### Group A — Create Form

```
A1. Phone lookup (sender): พิมพ์เบอร์เก่า → dropdown → กดเลือก → ชื่อ fill
A2. Phone lookup (receiver): เหมือน A1 แต่ receiver field
A3. Address collapsible: เปิดหน้า → address ซ่อน → กดปุ่ม → แสดง
A4. Sticky submit (mobile): setViewport(390,844) → ปุ่ fixed bottom → scroll → ยังอยู่
A5. COD currency: เลือกสาขาไทย → "THB" → เปลี่ยนลาว → "LAK"
A6. Progress indicator: เปิดหน้า → เห็น step 1-4 → scroll ถึง Route → step 3 active
```

### Group B — Scan Page

```
B1. Stay-on-page: search → select status → save → URL ยัง /scan → toast → input ว่าง
B2. Camera label (mobile): setViewport(390,844) → camera button มี visible text
B3. Terminal message: search delivered → เห็น message อธิบาย → Save disabled
B4. Roadmap card ถูกลบ: เปิด /scan → ไม่มี text "Reserved for bulk handling"
B5. Batch toggle: เปิด /scan → เห็น batch mode toggle
B6. Batch setup: toggle batch → setup panel → เลือก transition → เริ่มสแกน → counter=0
B7. Batch scan+confirm: scan 3 ตัว → counter 3 → review 3 rows → confirm → API called → summary
B8. Batch STOP ON ERROR: scan item ไม่ match → หยุด + error → Dismiss → scan ต่อ
```

### Group C — Shipments List

```
C1. Compact card (mobile): setViewport(390,844) → card height ≤ 80px → tap → expand
C2. Tabs scroll fade: setViewport(390,844) → tabs มี gradient mask ขวามือ
C3. Pagination total: > 20 shipments → แสดง total pages
```

### Group D — Dashboard

```
D1. Attention queue: arrived ปกติ + failed_delivery → queue แสดงแค่ failed_delivery
```

### Group E — Regression (ต้องไม่พัง)

```
E1.  Login admin / manager / staff
E2.  Create shipment (full form desktop)
E3.  Scan + update status
E4.  COD collect + transfer
E5.  Report export XLSX
E6.  Admin create + edit user
E7.  Public tracking /track
E8.  Logout
```

---

## 9. ลำดับการทำงาน

### Phase 0 — Production Security (ก่อนเปิดใช้งานจริง)
```
1. nginx: HTTPS + HSTS + CSP
2. env จริง (DB_PASSWORD, JWT_SECRET)
3. npx prisma migrate deploy
```

### Phase 1 — Quick Wins (< 1 วันรวม, ทำได้ทันที)
```
UX-03  ลบ Roadmap card
UX-06  Camera button + text
UX-10  COD currency label
UX-12  Terminal status message
UX-14  Tabs scroll fade
UX-20  Export ลบ hardcode
UX-21  Topbar mobile
UX-23  Pagination total pages
```

### Phase 2 — Core UX (2–3 วัน)
```
UX-01  th.json ภาษาไทย
UX-02  Stay-on-page หลัง scan save
UX-04  Sticky Submit bar mobile
UX-07  Compact card mobile
UX-08  Address collapsible
UX-09  Progress indicator
UX-11  Status pill buttons (mobile)
UX-15  Attention queue logic
UX-17  COD filter → pill tabs
UX-22  Manager mobile nav
```

### Phase 3 — Feature Work (ต้องการ API ใหม่, 3–4 วัน)
```
UX-05  Phone lookup autocomplete + API 5.1
UX-13  Batch scan mode + API 5.2
UX-19  Reports date range filter
```

### Phase 4 — Polish (ทำเรื่อยๆ)
```
UX-16  Flow board เพิ่ม delivered + returned
UX-18  COD collect form → Drawer
```

---

## 10. ทิศทางของระบบ (System Direction)

| หลักการ | หมายความว่า |
|---------|------------|
| **ไม่ขัดการทำงาน** | scan เสร็จก็ scan ต่อ ไม่ redirect ออก |
| **ข้อมูลซ้ำต้อง lookup** | เบอร์ลูกค้า → ชื่อขึ้นให้อัตโนมัติ |
| **Mobile-first สำหรับ Staff** | layout + controls นิ้วโป้งถึง |
| **Desktop-first สำหรับ Manager/Admin** | ข้อมูลหนาแน่น ตาราง export |
| **ภาษาตรงกับผู้ใช้** | TH / LO / EN เลือกได้ |
| **Visual language เดียวกันทุกหน้า** | pill tabs เหมือนกัน, StatusBadge สม่ำเสมอ |
| **Destructive action ต้องมี preview** | batch → preview table → confirm เสมอ |
