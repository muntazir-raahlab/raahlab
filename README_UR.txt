RaahLab V8.3 — Official Launch SEO-Ready Package

یہ پیکج Official Launch کے لیے تیار ہے، Preview deploy کے لیے نہیں۔

SEO updates:
- Preview-only noindex meta tag ہٹا دیا گیا ہے۔
- robots.txt میں crawling کی اجازت ہے۔
- Canonical اور Open Graph URL کو https://raahlab.netlify.app/ پر سیٹ کیا گیا ہے۔
- sitemap.xml اسی Final URL کے لیے شامل ہے۔
- Netlify build command تمام ضروری فائلیں dist میں copy اور verify کرتا ہے۔

اہم: اس ZIP کو اسی وقت deploy کریں جب Netlify میں raahlab.netlify.app نئی V8.3 site کے ساتھ attach ہو چکا ہو۔ اگر یہ domain ابھی V5 site پر ہے تو پہلے Netlify میں custom domain کو V8.3 site پر منتقل کریں۔ اس سے پہلے اس ZIP کو موجودہ preview URL پر deploy نہ کریں، ورنہ preview version search engines کے لیے کھل سکتا ہے اور canonical Final URL کی طرف اشارہ کرے گا۔

Deploy کے بعد لازمی checks:
1) https://raahlab.netlify.app/ کھلے اور V8.3 دکھائے۔
2) https://raahlab.netlify.app/robots.txt کھلے اور Allow: / دکھائے۔
3) https://raahlab.netlify.app/sitemap.xml کھلے اور Final URL دکھائے۔
4) Feedback form submit ہو اور Thank You page کھلے۔
5) Netlify Forms میں submission محفوظ ہو۔
6) Google Search Console میں domain/property verify کرکے sitemap submit کریں اور homepage کی URL Inspection سے indexing request دیں۔

یہ SEO کی بنیادی تکنیکی تیاری ہے، Google میں فوری indexing کی ضمانت نہیں۔

اس پیکج میں اصل index.html، thank-you.html، Netlify redirect اور موجودہ feedback form برقرار رکھے گئے ہیں۔


Official brand update: approved blue R + road mark is in raahlab-mark.svg; full horizontal wordmark and tagline are in raahlab-logo.svg. Keep both SVG files in the Netlify deploy output.


Admissions Radar update (V8.4):
- Added Virtual University (VU), University of the Punjab (PU), and NUMS.
- Updated the Radar review date to 19 November 2026.
- Clearly separates PU undergraduate and postgraduate deadlines.
- Added currently published NUMS Spring 2027 undergraduate deadlines.
- The Radar is still a manually reviewed official-source tracker, NOT an automatic notification monitor. Automatic monitoring requires a scheduled backend and deployment through a connected repository/build workflow; a drag-and-drop static ZIP cannot run scheduled background jobs.
- Always verify dates on the official portal before applying or paying.


RaahLab V8.5 Admissions Radar:
- Reviewed 19 November 2026.
- Added current NUST NET 2027 Series 1 final registration date (19 Nov 2026) and tentative future NET series.
- Added official NUML Spring 2027 dates, COMSATS Spring 2027 Lahore schedule, NUMS Spring 2027 undergraduate schedule, and PU Spring 2027 postgraduate deadline.
- Added/retained VU, PU undergraduate notices, FAST, IBA, LUMS, PMDC/MDCAT and UET/ECAT source links.
- Important: still a manually maintained static page. It does not poll portals, receive push notifications, or update itself. Each future update requires editing/redeploying the site. Automatic monitoring needs a scheduled backend or external workflow; do not describe this ZIP as automatic.


RaahLab V8.6 — Free daily admissions source monitor:
- Netlify Scheduled Function runs daily at 07:15 Pakistan Standard Time (02:15 UTC).
- Checks 12 official admissions/regulator pages: NUST, NUML, COMSATS, NUMS, Punjab University, Virtual University, FAST, IBA, LUMS, PM&DC, UET ECAT and HEC.
- Stores the latest scan and page fingerprints in Netlify Blobs.
- Public read-only endpoint: /.netlify/functions/admissions-feed
- Admissions Radar displays the last automatic check, reachability, changed pages and sources that could not be checked.
- It detects page-content changes only. It does NOT guarantee it can parse every PDF/notice or automatically verify/extract deadlines. A changed page should be reviewed at its official link.
- Netlify scheduled functions and Blobs are documented as available on all pricing plans, subject to plan usage limits.
- IMPORTANT DEPLOYMENT: Scheduled Functions need a published Netlify build that includes the `netlify/functions` directory and installs the package dependency. For reliable activation, connect this project to a GitHub repository in Netlify and deploy from the repository; simple static manual ZIP upload may not compile/deploy Functions. In Netlify: Project configuration > Developer settings > Continuous deployment > Repository > Push to new repository (or link an existing repo). Then make sure build command is `npm run build` and publish directory is `dist`.
- After first production deploy, open Netlify > Functions and confirm `admissions-monitor` has a Scheduled badge. Use Run now once to test. The feed will show data after the first successful run.
- No API keys or paid third-party services are required. Netlify usage/credit limits still apply.
