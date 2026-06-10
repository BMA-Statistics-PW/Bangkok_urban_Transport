# 🔐 คู่มือเพิ่มความปลอดภัย GitHub 100%
## BMA-Statistics-PW | ขั้นตอนที่ต้องทำเองบน GitHub

> © Prapawadee_W. | สร้างโดย Claude Sonnet 4.6

---

## ✅ ไฟล์ที่ Claude สร้างให้แล้ว (เพิ่มทุก repo)

| ไฟล์ | วัตถุประสงค์ | วิธีเพิ่ม |
|---|---|---|
| `.gitignore` | ป้องกันไฟล์ลับถูก commit | Copy ไปวางใน root ของทุก repo |
| `LICENSE` | ป้องกันลิขสิทธิ์ CC BY-NC 4.0 | Copy ไปวางใน root ของทุก repo |
| `CITATION.md` | กำหนดวิธีอ้างอิงที่ถูกต้อง | Copy ไปวางใน root ของทุก repo |
| `SECURITY.md` | นโยบายความปลอดภัย | Copy ไปวางใน root ของทุก repo |
| `git_secret_scan.sh` | สแกน git history | รันใน terminal ของแต่ละ repo |

**วิธีเพิ่มไฟล์ขึ้น GitHub:**
```
# บน repo ของ PW ใน terminal:
git add .gitignore LICENSE CITATION.md SECURITY.md
git commit -m "security: add .gitignore, LICENSE, CITATION, SECURITY policy"
git push
```

---

## 1️⃣ เปิด 2FA (Two-Factor Authentication)
**⭐ สำคัญที่สุด — ทำก่อนเป็นอันดับ 1**

```
GitHub.com → คลิกรูปโปรไฟล์ (มุมบนขวา)
→ Settings
→ Password and authentication
→ Two-factor authentication
→ Enable two-factor authentication
→ เลือก: Authenticator app (แนะนำ)
→ ติดตั้ง Microsoft Authenticator หรือ Google Authenticator บนมือถือ
→ Scan QR code
→ ใส่ 6 หลักจาก app เพื่อยืนยัน
→ บันทึก Recovery codes ไว้ในที่ปลอดภัย (สำคัญมาก!)
```

---

## 2️⃣ เปิด Secret Scanning
**ป้องกัน AI-generated key หลุดโดยไม่รู้ตัว**

```
GitHub.com → เลือก repo ที่ต้องการ (ทำทีละ repo)
→ Settings (แถบด้านบน)
→ Security (เมนูซ้าย)
→ Code security and analysis
→ Secret scanning → Enable
→ Push protection → Enable  ← สำคัญมาก ป้องกันก่อน push
```

*ทำซ้ำสำหรับทุก 9 repos*

---

## 3️⃣ เปิด Dependabot Alerts
**แจ้งเตือนเมื่อ library ที่ใช้มีช่องโหว่**

```
GitHub.com → เลือก repo
→ Settings → Security → Code security and analysis
→ Dependabot alerts → Enable
→ Dependabot security updates → Enable
```

---

## 4️⃣ เปิด Branch Protection บน main
**ป้องกันการลบหรือ force push โดยบังเอิญ**

```
GitHub.com → เลือก repo
→ Settings → Branches
→ Add branch ruleset (หรือ Add rule)
→ Branch name pattern: main
→ เปิด:
   ☑ Require a pull request before merging
   ☑ Do not allow bypassing the above settings
   ☑ Restrict deletions
→ Create / Save
```

*ทำกับ repo หลักที่ใช้งานจริง: BMA-travel-time-dashboard-TH, Bangkok_urban_Transport, BMA-Transport-Index*

---

## 5️⃣ ตรวจและลบ Token / SSH Keys เก่า
**ลบ access ที่ไม่ได้ใช้แล้ว**

### Personal Access Tokens:
```
Settings → Developer settings → Personal access tokens
→ ดูรายการ tokens ที่มีอยู่
→ Revoke token ที่:
   - ไม่รู้จัก
   - ไม่ได้ใช้นานกว่า 30 วัน
   - มีสิทธิ์มากเกินไป (เช่น write ทั้ง org)
```

### SSH Keys:
```
Settings → SSH and GPG keys
→ ดูรายการ keys ที่มีอยู่
→ Delete key ที่ไม่รู้จักหรือ device ที่ไม่ได้ใช้แล้ว
```

---

## 6️⃣ ตรวจ OAuth Apps
**ดู apps ที่เคย authorize ไว้**

```
Settings → Applications → Authorized OAuth Apps
→ ดูรายการ
→ Revoke access สำหรับ app ที่:
   - ไม่รู้จัก
   - ไม่ได้ใช้แล้ว
   - ดูน่าสงสัย
```

---

## 7️⃣ ตรวจ Security Log
**ดูประวัติการ login และการเข้าถึง**

```
Settings → Security log
→ ดู Recent events
→ สังเกตุ:
   - login จาก IP/device ที่ไม่รู้จัก
   - เวลาที่ไม่ใช่ตัวเอง login
   - token ถูกใช้งานแปลกๆ
```

---

## 8️⃣ ตรวจ Git History ด้วย Script

รันใน terminal ที่แต่ละ repo local:
```bash
# Clone repo ถ้ายังไม่มี
git clone https://github.com/BMA-Statistics-PW/BMA-travel-time-dashboard-TH.git
cd BMA-travel-time-dashboard-TH

# วาง git_secret_scan.sh แล้วรัน:
bash git_secret_scan.sh
```

---

## 📋 Checklist สรุป (ทำตามลำดับ)

| # | งาน | เวลา | ทำที่ |
|---|---|---|---|
| 1 | เปิด 2FA | 5 นาที | github.com/settings |
| 2 | เพิ่มไฟล์ .gitignore ทุก repo | 10 นาที | VS Code / terminal |
| 3 | เพิ่ม LICENSE ทุก repo | 5 นาที | VS Code / terminal |
| 4 | เพิ่ม SECURITY.md ทุก repo | 5 นาที | VS Code / terminal |
| 5 | เปิด Secret Scanning ทุก repo | 15 นาที | github.com/settings |
| 6 | เปิด Branch Protection main repos | 10 นาที | github.com/settings |
| 7 | ตรวจ Tokens และ SSH Keys | 5 นาที | github.com/settings |
| 8 | ตรวจ OAuth Apps | 3 นาที | github.com/settings |
| 9 | รัน git_secret_scan.sh | 5 นาที | terminal |
| **รวม** | | **~63 นาที** | |

---

*© Prapawadee_W. | คู่มือนี้สร้างขึ้นโดย Claude สำหรับ GitHub: BMA-Statistics-PW*
