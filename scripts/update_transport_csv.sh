#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$ROOT_DIR/dashboard-template/data"
METADATA_FILE="$DATA_DIR/transport_metadata.json"

mkdir -p "$DATA_DIR"

download_csv() {
  local url="$1"
  local output="$2"
  local tmp_file

  tmp_file="$(mktemp)"
  trap 'rm -f "$tmp_file"' RETURN

  curl --fail --location --retry 3 --retry-delay 2 --silent --show-error "$url" -o "$tmp_file"

  if grep -qi '<!DOCTYPE html\|<html' "$tmp_file"; then
    echo "Downloaded content is HTML instead of CSV for: $output" >&2
    exit 1
  fi

  if ! head -n 1 "$tmp_file" | grep -q ','; then
    echo "Downloaded content does not look like CSV for: $output" >&2
    exit 1
  fi

  mv "$tmp_file" "$output"
  trap - RETURN
}

download_csv \
  "https://docs.google.com/spreadsheets/d/1fOIvRw9bxC1DOWCnTN8hVW2Z8L4n6ICgzD_WxgIDYt0/gviz/tq?tqx=out:csv" \
  "$DATA_DIR/transport_share.csv"

download_csv \
  "https://docs.google.com/spreadsheets/d/1OV02tcFrMC6_gNKoHrb3K8mheRallx0cwYsFjZFqNb4/gviz/tq?tqx=out:csv&sheet=Report" \
  "$DATA_DIR/transport_report.csv"

share_updated_at="$(date -u -r "$DATA_DIR/transport_share.csv" +"%Y-%m-%dT%H:%M:%SZ")"
report_updated_at="$(date -u -r "$DATA_DIR/transport_report.csv" +"%Y-%m-%dT%H:%M:%SZ")"
generated_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cat > "$METADATA_FILE" <<EOF
{
  "generatedAt": "$generated_at",
  "datasets": {
    "share": {
      "file": "transport_share.csv",
      "updatedAt": "$share_updated_at"
    },
    "report": {
      "file": "transport_report.csv",
      "updatedAt": "$report_updated_at"
    }
  }
}
EOF

echo "CSV refresh completed successfully."