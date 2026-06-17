/* ────────────────────────────────────────────
   Email open/click tracking helpers.

   injectTracking() adds a 1x1 open pixel and rewrites <a href>
   links through the click redirector so we can record engagement
   even without provider webhooks.
   ─────────────────────────────────────────── */

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function injectTracking(html: string, emailId: string): string {
  const root = baseUrl();
  let out = html || "";

  // Rewrite links → /api/track/click/:id?u=<encoded>
  out = out.replace(/href="(https?:\/\/[^"]+)"/gi, (_m, url) => {
    const wrapped = `${root}/api/track/click/${emailId}?u=${encodeURIComponent(url)}`;
    return `href="${wrapped}"`;
  });

  // Append a 1x1 open pixel
  const pixel = `<img src="${root}/api/track/open/${emailId}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${pixel}</body>`);
  else out = out + pixel;

  return out;
}
