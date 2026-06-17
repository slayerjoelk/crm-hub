#!/bin/bash
# Create admin using Vercel's environment
cd "/Users/a887/Desktop/Coding Projects/SaaS/crm-hub"
vercel dev --env production -- node scripts/create-prod-admin.js
