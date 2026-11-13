# Bangkok Urban Transport — GOV.BKK theme + Admin shell

ปรับให้เป็นรูปแบบเดียวกับ BMA-travel-time-dashboard-TH · © Prapawadee_W.

## สิ่งที่เปลี่ยน
| ส่วน | เดิม | ใหม่ |
|---|---|---|
| โครงหน้า | header + แท็บแนวนอน | Sidebar (PC 248 / Tablet 76 icon bar / Mobile drawer) + Top bar |
| ส่วนหัว | header ไล่สีฟ้า | Hero banner เขียว GOV.BKK + 4 tile (คำนวณจาก DATA) |
| KPI | พิมพ์ค่าเอง 5 ใบ | คำนวณจาก DATA (BTS 255.8 −3.9%, MRT 151.9 −3.4%, SRT +12.8%) |
| สี UI | น้ำเงิน #1d4ed8 / #3b82f6 | เขียว #007744 (สีเส้นรถไฟคงเดิม) |
| ฟอนต์ | Sarabun ทั้งหมด | หัวข้อ Anuphan · เนื้อหา Sarabun |
| Dark mode | ไม่มี | มี (คีย์ bma-theme ใช้ร่วมกับ travel-time) · กราฟเปลี่ยนสีตามธีม |
| Emoji | ในชื่อการ์ด | ลบ |
| BRT 2567 | "ไม่มีข้อมูล" | "เฉพาะ 2 เดือน" (ตรงกับ DATA_NOTES.md และค่า 0.48 ในตาราง) |

## สลับภาษา ไทย / EN
ปุ่ม ไทย | EN ที่ top bar · บล็อก i18n.js ใน index.html (พจนานุกรม + กฎ พ.ศ./วันที่) แปลทั้งข้อความที่ JS สร้าง กราฟ และ aria-label · เปิดด้วย `?lang=en` หรือจำค่าใน localStorage `bma-dashboard-lang` (คีย์เดียวกับ travel-time) · โหมด EN แปลงปี พ.ศ. เป็น ค.ศ. (2569 → 2026)
เพิ่มข้อความใหม่: เติมคู่ [ไทย, English] ใน `G` ของบล็อก i18n.js

## ไฟล์
แก้เฉพาะ `index.html` (ไฟล์เดียว รวม CSS/JS ไว้ภายใน เหมือนหน้าเดิม ไม่ต้องอัปโหลดโฟลเดอร์ assets) — ส่วนที่รวมไว้: typography · dashboard-shell · urban · gov-bkk-theme (CSS) และ shell · i18n (JS) แยกเป็นบล็อกมีคอมเมนต์ชื่อไฟล์กำกับ

## ข้อสังเกตข้อมูล (ไม่ได้แก้ค่าในตาราง)
- ARL ปี 2566: ชุด สนข. 45.21 vs ชุด สจส. 22.56 — คนละแหล่ง/หน่วยนับ ควรระบุให้ชัด
