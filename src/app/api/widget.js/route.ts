import { type NextRequest, NextResponse } from "next/server";
import { db, schema, ensureTables } from "@/lib/db";
import { eq } from "drizzle-orm";

/* ────────────────────────────────────────────
   CRM Embeddable Capture Widget
   
   Serves the JavaScript snippet that ClarAccord
   (and any site) can embed to capture leads into
   the CRM.
   
   GET /api/widget.js?workspace=slug
   Returns: minified JS with form builder
   ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const workspaceSlug = req.nextUrl.searchParams.get("workspace") || "default";
  const captureUrl = `/api/capture`;

  const script = `
(function() {
  if (window.__crmWidgetLoaded) return;
  window.__crmWidgetLoaded = true;

  var WORKSPACE = "${workspaceSlug}";
  var CAPTURE_URL = "${captureUrl}";

  // Create styles
  var style = document.createElement("style");
  style.textContent = \`
    .crm-capture-widget * { box-sizing:border-box;margin:0;padding:0; }
    .crm-capture-widget { font-family:Inter,system-ui,sans-serif;max-width:400px; }
    .crm-capture-widget form { display:flex;flex-direction:column;gap:12px;background:var(--crm-bg,#0f1011);border:1px solid var(--crm-border,rgba(255,255,255,0.08));border-radius:12px;padding:20px; }
    .crm-capture-widget h3 { font-size:16px;font-weight:600;color:var(--crm-text,#f7f8f8);margin-bottom:4px; }
    .crm-capture-widget p { font-size:12px;color:var(--crm-muted,#8a8f98);margin-bottom:8px; }
    .crm-capture-widget input { width:100%;height:40px;padding:0 12px;background:var(--crm-input-bg,#08090a);border:1px solid var(--crm-border,rgba(255,255,255,0.06));border-radius:8px;font-size:13px;color:var(--crm-text,#f7f8f8);transition:border-color 0.15s; }
    .crm-capture-widget input:focus { outline:none;border-color:var(--crm-brand,#5e6ad2); }
    .crm-capture-widget input::placeholder { color:var(--crm-muted,#62666d); }
    .crm-capture-widget button { width:100%;height:40px;background:var(--crm-brand,#5e6ad2);color:#fff;font-size:13px;font-weight:500;border:none;border-radius:8px;cursor:pointer;transition:background 0.15s; }
    .crm-capture-widget button:hover { background:var(--crm-brand-hover,#828fff); }
    .crm-capture-widget button:disabled { opacity:0.5;cursor:default; }
    .crm-capture-widget .crm-status { font-size:12px;margin-top:8px;padding:8px 12px;border-radius:8px; }
    .crm-capture-widget .crm-status-success { background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.2); }
    .crm-capture-widget .crm-status-error { background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2); }
    .crm-powered { text-align:center;font-size:10px;color:#62666d;margin-top:8px;opacity:0.6; }
  \`;
  document.head.appendChild(style);

  // Create widget container
  var widget = document.createElement("div");
  widget.className = "crm-capture-widget";
  
  var targets = document.querySelectorAll("[data-crm-capture]");
  targets.forEach(function(target) {
    var clone = widget.cloneNode(true);
    clone.innerHTML = \`
      <form id="crmForm_\\\${Math.random().toString(36).slice(2)}"> // Client-side only: Math.random() is fine for DOM IDs
        <h3>Stay in the loop</h3>
        <p>Get product updates and early access.</p>
        <input type="email" name="email" placeholder="you@company.com" required />
        <input type="text" name="firstName" placeholder="First name (optional)" />
        <button type="submit">Get early access</button>
        <div class="crm-status" style="display:none"></div>
        <div class="crm-powered">Powered by CRM Hub</div>
      </form>
    \`;

    var form = clone.querySelector("form");
    var status = clone.querySelector(".crm-status");
    var button = clone.querySelector("button");

    form.onsubmit = async function(e) {
      e.preventDefault();
      var data = {};
      form.querySelectorAll("input[name]").forEach(function(inp) {
        if (inp.value.trim()) data[inp.name] = inp.value.trim();
      });
      if (!data.email) return;

      button.disabled = true;
      button.textContent = "Sending...";
      status.style.display = "none";

      try {
        var res = await fetch(CAPTURE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-slug": WORKSPACE,
          },
          body: JSON.stringify({
            email: data.email,
            firstName: data.firstName || "",
            sourceType: "organic",
            sourceDetail: window.location.hostname + window.location.pathname,
            tags: ["website_capture"],
          }),
        });

        if (res.ok) {
          status.className = "crm-status crm-status-success";
          status.textContent = "✓ You're on the list! We'll be in touch.";
          status.style.display = "block";
          form.reset();
        } else {
          throw new Error("Failed");
        }
      } catch (err) {
        status.className = "crm-status crm-status-error";
        status.textContent = "Something went wrong. Try again.";
        status.style.display = "block";
      }

      button.disabled = false;
      button.textContent = "Get early access";
    };

    target.appendChild(clone);
  });
})();
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type, x-workspace-slug",
    },
  });
}
