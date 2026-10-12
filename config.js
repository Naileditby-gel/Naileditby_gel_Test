// Naileditby_gel TEST Supabase configuration
window.NAILEDIT_CONFIG = {
  SUPABASE_URL: 'https://tjudndgyyilrunwgyshk.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_Ly4XpP2RUZaYv5gx_pTqPQ_1Aa-t-IP',
  // Payment QR payloads decoded from Gel's supplied InstaPay QR images.
  // GCash uses the InstaPay QR; bank transfer uses the GoTyme Bank QR.
  GCASH_QR_PAYLOAD: '00020101021127830012com.p2pqrpay0111GXCHPHM2XXX02089996440303152170200000006560417DWQM4TK3JDNWMFC3K5204601653036085802PH5912AN**L J** E.6015QUEZON CITY CPO610412346304E467',
  BANK_QR_PAYLOAD: '00020101021127590012com.p2pqrpay0111GOTYPHM2XXX02089996440304120187584971545204601653036085802PH5917ANGEL JOY ENDERES6011Quezon City63049742'
};


// Public content sync for the TEST homepage. This runs independently of booking/payment scripts.
(function () {
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]);
    });
  }
  function imageUrl(sb, path) {
    if (!path) return '';
    if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0 || path.indexOf('data:image/') === 0) return path;
    return sb.storage.from('nail-portfolio').getPublicUrl(path).data.publicUrl;
  }
  function peso(n) { return '₱' + Number(n).toLocaleString('en-PH', {maximumFractionDigits:2}); }
  function sectionForPromo() {
    var h = Array.from(document.querySelectorAll('h2')).find(function (x) { return /October Nail Promo/i.test(x.textContent); });
    return h ? h.closest('section') : null;
  }
  function addSectionBefore(el, id, title, kicker, body) {
    var node = document.createElement('section');
    node.className = 'section soft';
    node.id = id;
    node.innerHTML = '<div class="wrap"><div class="center"><div class="kicker">' + esc(kicker) + '</div><h2 class="section-title">' + esc(title) + '</h2><div class="goldline"></div></div>' + body + '</div>';
    el.parentNode.insertBefore(node, el);
    return node;
  }
  function addPolishStyles() {
    if (document.getElementById('nailedit-public-polish')) return;
    var style = document.createElement('style');
    style.id = 'nailedit-public-polish';
    style.textContent = '.promo-feature-card{padding:clamp(14px,2.5vw,24px);text-align:center}.promo-feature-image{display:block;width:100%;height:auto;max-height:none;object-fit:contain;border-radius:16px}.promo-feature-copy{max-width:760px;margin:0 auto;padding:22px 16px 12px;text-align:center}.promo-feature-copy h3{font-family:"Playfair Display",serif;font-size:clamp(24px,3vw,34px);font-weight:600;line-height:1.25;color:var(--wine,#6f2944);margin:0 0 12px}.promo-feature-price{font-size:1.12rem;color:var(--rose,#e96d9a);margin:0 0 10px}.promo-feature-price span{font-size:.9em;text-decoration:line-through;opacity:.65;margin-left:8px}.promo-feature-description{font-size:.96rem;line-height:1.8;color:var(--ink,#38252c);max-width:620px;margin:0 auto 18px}.rate-grid .gallery-card{font-family:Poppins,Arial,sans-serif;color:var(--ink,#38252c);padding:22px!important}.rate-grid .gallery-card h3{font-family:Poppins,Arial,sans-serif;font-size:1rem;font-weight:600;line-height:1.55;letter-spacing:.01em;color:var(--wine,#6f2944);margin:0 0 10px!important}.rate-grid .gallery-card p{font-family:Poppins,Arial,sans-serif;font-size:.9rem;line-height:1.7;color:#806a72}.rate-grid .gallery-card p strong{font-weight:600;color:var(--rose,#e96d9a)}';
    document.head.appendChild(style);
  }
  async function syncPublicContent() {
    addPolishStyles();\n    var cfg = window.NAILEDIT_CONFIG;
    if (!cfg || !window.supabase || !window.supabase.createClient) return;
    var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    var gallery = document.querySelector('#gallery .gallery');
    var gallerySection = document.getElementById('gallery');
    var oldPromo = sectionForPromo();
    try {
      var results = await Promise.all([
        sb.from('site_gallery').select('title,caption,image_path,alt_text,display_order,is_published').eq('is_published', true).order('display_order').order('created_at'),
        sb.from('site_rates').select('service_name,description,pricing_type,price,min_price,max_price,display_order,is_published').eq('is_published', true).order('display_order').order('created_at'),
        sb.from('site_promotions').select('title,description,promo_price,original_price,image_path,starts_at,ends_at,display_order,is_published').eq('is_published', true).order('display_order').order('created_at')
      ]);
      var g = results[0], rates = results[1], promos = results[2];
      if (!g.error && Array.isArray(g.data) && g.data.length && gallery) {
        gallery.innerHTML = g.data.map(function (r) {
          return '<div class="gallery-card"><img loading="lazy" src="' + esc(imageUrl(sb, r.image_path)) + '" alt="' + esc(r.alt_text || r.title) + '"><div class="gallery-caption"><strong>' + esc(r.title) + '</strong>' + (r.caption ? '<p>' + esc(r.caption) + '</p>' : '') + '</div></div>';
        }).join('');
      }
      if (gallerySection && !document.getElementById('dynamic-rates')) {
        var rateBody = '<div class="rate-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:24px">';
        if (!rates.error && rates.data && rates.data.length) {
          rateBody += rates.data.map(function (r) {
            var price = r.pricing_type === 'fixed' ? peso(r.price) : r.pricing_type === 'starting_at' ? 'Starting at ' + peso(r.price) : r.pricing_type === 'range' ? peso(r.min_price) + '–' + peso(r.max_price) : 'Price confirmed after design review';
            return '<article class="gallery-card" style="padding:20px"><h3 style="margin:0 0 8px">' + esc(r.service_name) + '</h3><p style="margin:0 0 8px"><strong>' + esc(price) + '</strong></p>' + (r.description ? '<p style="margin:0">' + esc(r.description) + '</p>' : '') + '</article>';
          }).join('');
        } else {
          rateBody += '<p class="sub" style="grid-column:1/-1">Pricing may vary depending on nail length, design, and details. Please share your inspiration when booking for a quote.</p>';
        }
        rateBody += '</div>';
        addSectionBefore(oldPromo || gallerySection, 'dynamic-rates', 'Service Rates', 'Pretty nails, clear pricing', rateBody);
      }
      if (oldPromo) {
        var now = Date.now();
        var current = !promos.error && (promos.data || []).filter(function (p) {
          return (!p.starts_at || new Date(p.starts_at).getTime() <= now) && (!p.ends_at || new Date(p.ends_at).getTime() >= now);
        });
        if (current && current.length) {
          oldPromo.innerHTML = '<div class="wrap"><div class="center"><div class="kicker">Special offers</div><h2 class="section-title">Current Promotions ♡</h2><div class="goldline"></div><p class="sub">Check out our current offers. Terms and availability may apply.</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin-top:24px">' +
            current.map(function (p) {
              return '<article class="gallery-card promo-feature-card">' + (p.image_path ? '<img loading="lazy" src="' + esc(imageUrl(sb,p.image_path)) + '" alt="' + esc(p.title) + '" class="promo-feature-image">' : '') + '<div class="promo-feature-copy"><h3>' + esc(p.title) + '</h3>' + (p.promo_price != null ? '<p class="promo-feature-price"><strong>' + peso(p.promo_price) + (p.original_price != null ? ' <span>' + peso(p.original_price) + '</span>' : '') + '</strong></p>' : '') + (p.description ? '<p class="promo-feature-description">' + esc(p.description) + '</p>' : '') + '<a class="btn" href="#booking">Book Now →</a></div></article>';
            }).join('') + '</div></div>';
          oldPromo.style.display = '';
        } else {
          oldPromo.style.display = 'none';
        }
      }
    } catch (e) {
      // Keep the original page and booking flow intact if content loading fails.
      console.warn('Public content sync skipped:', e);
    }
  }
  function reorderHomepageSections() {
    var ids = ['about', 'gallery', 'promo', 'services', 'booking'];
    var nodes = ids.map(function (id) { return document.getElementById(id); });
    if (nodes.some(function (node) { return !node; })) {
      console.warn('Homepage section order unchanged: one or more section IDs were not found.');
      return;
    }
    var parent = nodes[0].parentElement;
    if (!nodes.every(function (node) { return node.parentElement === parent; })) {
      console.warn('Homepage section order unchanged: sections do not share the same parent.');
      return;
    }
    var anchor = nodes[0];
    nodes.slice(1).forEach(function (node) {
      parent.insertBefore(node, anchor.nextSibling);
      anchor = node;
    });
  }
  function polishHeroPromoLink() {
    var links = Array.from(document.querySelectorAll('a[href="#promo"]'));
    links.forEach(function (a) {
      if (/October Promo/i.test(a.textContent)) a.textContent = 'Explore Current Promotions';
    });
  }
  function refreshFaq() {
    var faq = document.querySelector('#faq .faq');
    if (!faq || faq.dataset.evergreenReady) return;
    faq.innerHTML =
      '<details><summary>How do I book an appointment?</summary><p>Fill out the booking form with your preferred date, time, and service. Submitting a request does not automatically confirm your appointment. Gel will review your request and confirm your slot.</p></details>' +
      '<details><summary>Do you accept nail design requests?</summary><p>Yes! Add your inspiration or design notes in the booking form. Custom designs may have different pricing depending on the details.</p></details>' +
      '<details><summary>Is a deposit required to book?</summary><p>Yes. A deposit is required to secure your appointment. Your booking is confirmed once Gel has reviewed your request and confirmed the appointment details and deposit.</p></details>' +
      '<details><summary>How much do nail services cost?</summary><p>Pricing may vary depending on nail length, design, and details. Please share your inspiration when booking so Gel can provide the appropriate price.</p></details>' +
      '<details><summary>Do you offer promotions?</summary><p>We occasionally offer special promotions. Check the Current Promotions section for available offers and their terms.</p></details>' +
      '<details><summary>What if I need to change or cancel my appointment?</summary><p>Please contact Gel as soon as possible. Appointment changes are subject to availability and the business policies.</p></details>';
    faq.dataset.evergreenReady = 'true';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { reorderHomepageSections(); polishHeroPromoLink(); refreshFaq(); syncPublicContent(); });
  } else {
    polishHeroPromoLink(); refreshFaq(); syncPublicContent();
  }
})();
