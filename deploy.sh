#!/usr/bin/env bash
set -euo pipefail

# Packages, installs, elevates, and launches G5 Quick Settings on a rooted LG webOS TV.
TV_IP="${1:-${TV_IP:-192.168.1.94}}"
APP_ID="mscha.g5quicksettings"
SERVICE_ID="${APP_ID}.service"
IPK_FILE="dist/${APP_ID}_1.0.0_all.ipk"
REMOTE_IPK="/tmp/${APP_ID}_1.0.0_all.ipk"

echo "[1/5] Building ${IPK_FILE}..."
python3 build-ipk.py

echo "[2/5] Copying .ipk to ${TV_IP}..."
scp "${IPK_FILE}" "root@${TV_IP}:${REMOTE_IPK}"

echo "[3/5] Installing app and service on ${TV_IP}..."
ssh "root@${TV_IP}" "
  luna-send -n 1 -f luna://com.webos.applicationManager/closeByAppId '{\"id\":\"${APP_ID}\"}' </dev/null >/dev/null 2>&1 || true;
  luna-send -n 1 -f luna://com.webos.appInstallService/dev/install '{\"id\":\"${APP_ID}\",\"ipkUrl\":\"${REMOTE_IPK}\",\"subscribe\":false}' </dev/null;
  echo 'Waiting for installation to finish...';
  sleep 6;
  i=0;
  while [ ! -f '/var/luna-service2-dev/services.d/${SERVICE_ID}.service' ] && [ \"\$i\" -lt 15 ]; do
    sleep 1;
    i=\$((i + 1));
  done;
  rm -f '${REMOTE_IPK}'
"

echo "[4/5] Elevating ${SERVICE_ID} via Homebrew Channel..."
ssh "root@${TV_IP}" "
  ELEVATE='/media/developer/apps/usr/palm/services/org.webosbrew.hbchannel.service/elevate-service';
  if [ -x \"\${ELEVATE}\" ]; then
    \"\${ELEVATE}\" '${SERVICE_ID}';
  else
    echo 'WARNING: elevate-service not found';
  fi;
  ls-control scan-services;
  for pid in \$(ps | awk '/mscha\.g5quicksettings\.service/ && !/sh -c/ && !/awk/ {print \$1}'); do
    kill \"\${pid}\" 2>/dev/null || true;
  done;
  sleep 1;
  echo '=== Service Ping Check ===';
  luna-send -n 1 -f 'luna://${SERVICE_ID}/ping' '{}' </dev/null 2>&1;
  echo '=== Settings Read Check via Service ===';
  luna-send -n 1 -f 'luna://${SERVICE_ID}/settings' '{\"method\":\"getSystemSettings\",\"params\":{\"category\":\"picture\",\"keys\":[\"backlight\",\"pictureMode\"]}}' </dev/null 2>&1
"

echo "[5/5] Launching overlay..."
ssh "root@${TV_IP}" "luna-send -n 1 luna://com.webos.applicationManager/launch '{\"id\":\"${APP_ID}\"}' </dev/null"
echo "Done!"
