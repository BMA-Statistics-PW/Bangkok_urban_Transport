# Security Policy | นโยบายความปลอดภัย

## ขอบเขตของ Repository นี้

Repository นี้เป็น **Static Web Dashboard** ที่ใช้แสดงข้อมูลสถิติการจราจรและขนส่งของกรุงเทพมหานคร
ทุก repository ใน [BMA-Statistics-PW](https://github.com/BMA-Statistics-PW) ใช้เทคโนโลยี:

- HTML5 / CSS3 / JavaScript (Vanilla)
- ไม่มี Backend Server
- ไม่มีการเชื่อมต่อฐานข้อมูลโดยตรง
- ข้อมูลทั้งหมดเป็น Static (ฝังในโค้ดหรือ JSON ไฟล์)

---

## การแจ้งช่องโหว่ความปลอดภัย (Reporting a Vulnerability)

หากพบปัญหาด้านความปลอดภัย **กรุณาอย่าเปิดเป็น Public Issue**

### ช่องทางการแจ้ง
- **GitHub**: ใช้ [Security Advisories](../../security/advisories/new) (Private)
- **LinkedIn**: https://www.linkedin.com/in/prapawadee-w/

### ข้อมูลที่ควรแจ้ง
1. คำอธิบายช่องโหว่
2. ขั้นตอนในการ reproduce
3. ผลกระทบที่อาจเกิดขึ้น
4. ข้อเสนอแนะในการแก้ไข (ถ้ามี)

---

## นโยบายการรักษาความปลอดภัย

### สิ่งที่ไม่มีใน Repository นี้
- ❌ API Keys หรือ Secret Keys
- ❌ Database credentials
- ❌ ข้อมูลส่วนบุคคลของบุคคลใดๆ
- ❌ ข้อมูลราชการที่เป็นความลับ

### มาตรการที่ใช้
- ✅ Secret Scanning เปิดใช้งาน
- ✅ .gitignore ครอบคลุม pattern ที่เสี่ยง
- ✅ Branch protection บน main branch
- ✅ 2FA บน GitHub account
- ✅ ตรวจสอบโค้ดก่อน commit ทุกครั้ง

---

## ข้อมูลใน Repository

ข้อมูลทั้งหมดที่ใช้ใน Dashboard เป็น **ข้อมูลสาธารณะ** จากหน่วยงานราชการ
ไม่มีข้อมูลส่วนบุคคลหรือข้อมูลที่เป็นความลับ

---

*© Prapawadee_W. | กลุ่มงานสถิติและวิจัย สจส. กทม.*
*Last updated: 2026*
