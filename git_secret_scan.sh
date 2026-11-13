#!/bin/bash
# ============================================================
#  git_secret_scan.sh
#  ตรวจหา Secret ที่อาจซ่อนอยู่ใน Git History
#  ใช้งาน: bash git_secret_scan.sh
#  © Prapawadee_W.
# ============================================================

echo "======================================================"
echo "  🔍 Git History Secret Scanner"
echo "  BMA-Statistics-PW Security Check"
echo "======================================================"
echo ""

# สีสำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FOUND=0

echo "📁 ตรวจหาไฟล์ลับใน git history..."
echo ""

# ---- ตรวจไฟล์ที่น่าสงสัย ----
FILES_TO_CHECK=(
  ".env"
  "*.key"
  "secrets.json"
  "config.json"
  "credentials.json"
  "firebase.json"
  ".clasp.json"
  "*.pem"
  "token.txt"
  "auth.json"
)

for pattern in "${FILES_TO_CHECK[@]}"; do
  result=$(git log --all --full-history -- "$pattern" 2>/dev/null | head -5)
  if [ -n "$result" ]; then
    echo -e "${RED}⚠️  พบ '$pattern' เคยอยู่ใน history:${NC}"
    echo "$result" | head -3
    FOUND=1
    echo ""
  fi
done

# ---- ตรวจ keyword ใน commit ----
echo "🔑 ตรวจหา keyword ที่น่าสงสัยใน commits..."
echo ""

KEYWORDS=(
  "apikey"
  "api_key"
  "API_KEY"
  "password"
  "PASSWORD"
  "secret"
  "SECRET"
  "token"
  "TOKEN"
  "DB_PASS"
  "database_url"
  "firebase"
  "supabase"
)

for kw in "${KEYWORDS[@]}"; do
  result=$(git log --all -S "$kw" --oneline 2>/dev/null | head -3)
  if [ -n "$result" ]; then
    echo -e "${YELLOW}💛 พบ keyword '$kw' ใน commit:${NC}"
    echo "$result"
    FOUND=1
    echo ""
  fi
done

echo ""
echo "======================================================"
if [ $FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ ไม่พบ Secret ใน git history — ปลอดภัย!${NC}"
else
  echo -e "${RED}⚠️  พบ items น่าสงสัย — ควรตรวจสอบเพิ่มเติม${NC}"
  echo ""
  echo "📋 วิธีลบออกจาก history อย่างถาวร:"
  echo "   1. ใช้: git filter-repo --path <ไฟล์> --invert-paths"
  echo "   2. หรือ: BFG Repo Cleaner (https://rtyley.github.io/bfg-repo-cleaner/)"
  echo "   3. ⚠️  Revoke key ทันทีแม้จะลบออกจาก history แล้ว"
fi
echo "======================================================"
echo ""
echo "© Prapawadee_W. | BMA-Statistics-PW Security Tools"
