#!/usr/bin/env bash
# run-automation-cron.sh — fire the CRM automation pipeline (scoring + sequences + tasks)
#
# Vercel Hobby only runs cron jobs once/day. For real outreach cadence (every 15 min),
# run this from an external scheduler instead:
#
#   crontab -e   →   */15 * * * * /Users/a887/Desktop/Coding\ Projects/SaaS/crm-hub/scripts/run-automation-cron.sh >> /tmp/crm-cron.log 2>&1
#
#   or point cron-job.org at the URL below with the Authorization header.
#
# Env:
#   CRM_BASE_URL   default https://crm-hub-ruby.vercel.app  (use http://localhost:3939 for local)
#   CRON_SECRET    must match the deployment's CRON_SECRET env var
#   CRM_WORKSPACE  optional ?workspace=slug to limit to one workspace (default: all active)

set -euo pipefail

BASE_URL="${CRM_BASE_URL:-https://crm-hub-ruby.vercel.app}"
SECRET="${CRON_SECRET:-crm-hub-cron-secret}"
WORKSPACE_QS=""
[ -n "${CRM_WORKSPACE:-}" ] && WORKSPACE_QS="?workspace=${CRM_WORKSPACE}"

URL="${BASE_URL}/api/automation/cron${WORKSPACE_QS}"

echo "[$(date '+%Y-%m-%dT%H:%M:%S%z')] → ${URL}"
curl -fsS -m 60 \
  -H "Authorization: Bearer ${SECRET}" \
  "${URL}"
echo
