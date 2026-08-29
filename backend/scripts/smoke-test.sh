#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"

TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

pass() {
  printf "✓ %s\n" "$1"
}

fail() {
  printf "✗ %s\n" "$1"
  exit 1
}

echo
echo "Reflex API smoke tests"
echo "Target: $BASE_URL"
echo

# ------------------------------------------------------------
# Health
# ------------------------------------------------------------

HEALTH="$(
  curl -fsS "$BASE_URL/health"
)"

printf '%s' "$HEALTH" |
python3 -c '
import json, sys

data = json.load(sys.stdin)

assert data["status"] == "ok"
assert data["database"] == "connected"
assert data["redis"] == "connected"
' || fail "Health check"

pass "Health check"

# ------------------------------------------------------------
# Valid retailer authentication
# ------------------------------------------------------------

LOGIN="$(
  curl -fsS \
    -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"phone\":\"+254700000002\",
      \"password\":\"Demo123!\"
    }"
)"

RETAILER_TOKEN="$(
  printf '%s' "$LOGIN" |
  python3 -c '
import json, sys

data = json.load(sys.stdin)

assert data["success"] is True
assert data["user"]["role"] == "retailer"

print(data["access_token"])
'
)"

if [ -z "$RETAILER_TOKEN" ]; then
  fail "Retailer authentication"
fi

pass "Retailer authentication"

# ------------------------------------------------------------
# Wrong password
# ------------------------------------------------------------

STATUS="$(
  curl -sS \
    -o "$TMP_DIR/wrong-login.json" \
    -w "%{http_code}" \
    -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"phone\":\"+254700000002\",
      \"password\":\"wrong-password\"
    }"
)"

if [ "$STATUS" != "401" ]; then
  fail "Wrong password returns 401"
fi

pass "Wrong password returns 401"

# ------------------------------------------------------------
# Protected endpoint
# ------------------------------------------------------------

STATUS="$(
  curl -sS \
    -o "$TMP_DIR/unauthorized.json" \
    -w "%{http_code}" \
    "$BASE_URL/delivery-requests"
)"

if [ "$STATUS" != "401" ]; then
  fail "Protected route requires JWT"
fi

pass "Protected route requires JWT"

# ------------------------------------------------------------
# Authenticated delivery listing
# ------------------------------------------------------------

STATUS="$(
  curl -sS \
    -o "$TMP_DIR/deliveries.json" \
    -w "%{http_code}" \
    "$BASE_URL/delivery-requests" \
    -H "Authorization: Bearer $RETAILER_TOKEN"
)"

if [ "$STATUS" != "200" ]; then
  fail "Authenticated delivery list"
fi

pass "Authenticated delivery list"

# ------------------------------------------------------------
# Standard 404
# ------------------------------------------------------------

STATUS="$(
  curl -sS \
    -o "$TMP_DIR/not-found.json" \
    -w "%{http_code}" \
    "$BASE_URL/does-not-exist"
)"

if [ "$STATUS" != "404" ]; then
  fail "Unknown route returns 404"
fi

python3 - "$TMP_DIR/not-found.json" <<'PY'
import json
import sys

with open(sys.argv[1]) as f:
    data = json.load(f)

assert data["error"]["code"] == "NOT_FOUND"
assert data["request_id"]
PY

pass "Standard 404 response"

# ------------------------------------------------------------
# Helmet security headers
# ------------------------------------------------------------

curl -sS \
  -D "$TMP_DIR/security-headers.txt" \
  -o /dev/null \
  "$BASE_URL/health"

if ! grep -qi \
  '^x-content-type-options: nosniff' \
  "$TMP_DIR/security-headers.txt"; then

  fail "Security headers"
fi

pass "Security headers"

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------

curl -sS \
  -D "$TMP_DIR/cors-headers.txt" \
  -o /dev/null \
  -H "Origin: http://localhost:5173" \
  "$BASE_URL/health"

if ! grep -qi \
  '^access-control-allow-origin: http://localhost:5173' \
  "$TMP_DIR/cors-headers.txt"; then

  fail "CORS configuration"
fi

pass "CORS configuration"

# ------------------------------------------------------------
# Swagger
# ------------------------------------------------------------

STATUS="$(
  curl -sS \
    -o /dev/null \
    -w "%{http_code}" \
    "$BASE_URL/docs/"
)"

if [ "$STATUS" != "200" ]; then
  fail "Swagger documentation"
fi

pass "Swagger documentation"

echo
echo "All Reflex smoke tests passed."
echo