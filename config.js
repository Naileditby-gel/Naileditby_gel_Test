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
    addPolishStyles();
    var cfg = window.NAILEDIT_CONFIG;
    if (!cfg || !window.supabase || !window.supabase.createClient) return;
    var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    var gallery = document.querySelector('#gallery .gallery');
    var gallerySection = document.getElementById('gallery');
    var oldPromo = sectionForPromo();
    try {
      var results = await Promise.all([
        sb.from('site_gallery').select('title,caption,image_path,alt_text,display_order,is_published').eq('is_published', true).order('display_order').order('created_at'),
        sb.from('site_rates').select('service_name,description,pricing_type,price,min_price,max_price,display_order,is_published,is_signature,signature_slot,signature_price_text').eq('is_published', true).order('display_order').order('created_at'),
        sb.from('site_promotions').select('title,image_path,starts_at,ends_at,display_order,is_published').eq('is_published', true).order('display_order').order('created_at'),
        sb.from('site_promo_services').select('category,price,description,starts_at,ends_at,display_order,is_published').eq('is_published', true).order('display_order').order('created_at')
      ]);
      var g = results[0], rates = results[1], promos = results[2], promoServices = results[3];
      // Signature Nail Services are managed separately from regular Service Rates.
      if (!g.error && Array.isArray(g.data) && g.data.length && gallery) {
        gallery.innerHTML = g.data.map(function (r) {
          return '<div class="gallery-card"><img loading="lazy" src="' + esc(imageUrl(sb, r.image_path)) + '" alt="' + esc(r.alt_text || r.title) + '"><div class="gallery-caption"><strong>' + esc(r.title) + '</strong>' + (r.caption ? '<p>' + esc(r.caption) + '</p>' : '') + '</div></div>';
        }).join('');
      }
      if (gallerySection && !/portfolio\.html$/i.test(window.location.pathname) && !document.getElementById('dynamic-rates')) {
        var rateBody = '<div class="rate-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:24px">';
        if (!rates.error && rates.data && rates.data.length) {
          rateBody += rates.data.filter(function (r) { return !r.is_signature; }).map(function (r) {
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
        // Promotional Nail Services come from their own manager, independently of poster uploads and regular rates.
        var signatureGrid = document.querySelector('#services .cards');
        var activeServices = !promoServices.error && (promoServices.data || []).filter(function (s) {
          return (!s.starts_at || new Date(s.starts_at).getTime() <= now) && (!s.ends_at || new Date(s.ends_at).getTime() >= now);
        }).slice(0, 3);
        if (signatureGrid && activeServices && activeServices.length) {
          signatureGrid.innerHTML = activeServices.map(function (s) {
            return '<article class="card"><h3>' + esc(s.category) + '</h3><div class="price">' + esc(s.price != null ? peso(s.price) : 'Price confirmed after design review') + '</div><p>' + esc(s.description || '') + '</p></article>';
          }).join('');
        } else if (signatureGrid) {
          signatureGrid.innerHTML = '<article class="card"><h3>New Offers Coming Soon</h3><div class="price">Stay tuned</div><p>Featured Nail Services will appear here when published.</p></article>';
        }
        if (current && current.length) {
          oldPromo.innerHTML = '<div class="wrap"><div class="center"><div class="kicker">Special offers</div><h2 class="section-title">Current Promotions ♡</h2><div class="goldline"></div><p class="sub">Explore our latest nail offers and special treats.</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin-top:24px">' +
            current.map(function (p) {
              return '<article class="gallery-card promo-feature-card">' + (p.image_path ? '<img loading="lazy" src="' + esc(imageUrl(sb,p.image_path)) + '" alt="' + esc(p.title) + '" class="promo-feature-image">' : '') + '<div class="promo-feature-copy"><h3>' + esc(p.title) + '</h3></div></article>';
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
    // These sections are direct children of body in the current homepage.
    // Place the requested customer journey immediately before Reviews (or FAQ as fallback).
    var ids = ['about', 'gallery', 'promo', 'services', 'booking'];
    var nodes = ids.map(function (id) { return document.getElementById(id); });
    if (nodes.some(function (node) { return !node; })) {
      console.warn('Homepage section order skipped: missing section ID.');
      return;
    }
    var anchor = document.getElementById('reviews') || document.getElementById('faq');
    if (!anchor || !anchor.parentNode) {
      console.warn('Homepage section order skipped: could not find the section anchor.');
      return;
    }
    var parent = anchor.parentNode;
    nodes.forEach(function (node) {
      if (node.parentNode !== parent) {
        console.warn('Homepage section order skipped: unexpected section structure.');
        return;
      }
      parent.insertBefore(node, anchor);
    });
  }
  function refreshBusinessPolicies() {
    document.querySelectorAll('.studio-info').forEach(function (box) {
      box.innerHTML = box.innerHTML.replace(/8:00 AM\s*[–-]\s*4:00 PM/g, '8:00 AM – 11:00 PM (Mon–Sun)');
    });
    document.querySelectorAll('.policy-box li').forEach(function (item) {
      var label = item.querySelector('strong');
      if (label && /Late policy/i.test(label.textContent)) {
        item.innerHTML = '<strong>Late policy:</strong> 20 minutes late = ₱100 late fee. 1 hour late = appointment automatically voided/cancelled and the deposit is forfeited, unless you have informed Gel and Gel has confirmed a revised arrangement.';
      }
    });
  }
  function makeFooterMessageEvergreen() {
    var headings = Array.from(document.querySelectorAll('h1,h2,h3')).filter(function (h) {
      return /let.s get you nailed/i.test(h.textContent);
    });
    headings.forEach(function (heading) {
      var section = heading.closest('section') || heading.parentElement;
      if (!section) return;
      var paragraphs = Array.from(section.querySelectorAll('p'));
      paragraphs.forEach(function (p) {
        if (/limited slots available|limited time|slots available/i.test(p.textContent)) {
          p.textContent = 'Your next favorite set is waiting. Contact Gel to reserve your appointment.';
        }
      });
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
  function refreshBookingTimeSlots() {
    // The actual booking form uses #btime. Its original script repopulates options
    // after the date is chosen, so re-apply the business-hours list after each update.
    var expected = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '21:00'];
    function updateTimeSelect() {
      var select = document.getElementById('btime');
      if (!select) return;
      var placeholder = Array.from(select.options).find(function (o) {
        return !o.value || /choose a time|select time|choose a date/i.test((o.textContent || '').trim());
      });
      var current = select.value;
      var existing = Array.from(select.options).map(function (o) { return o.value; });
      if (expected.every(function (t) { return existing.indexOf(t) !== -1; })) return;
      select.innerHTML = '';
      var first = document.createElement('option');
      first.value = '';
      first.textContent = placeholder ? placeholder.textContent.trim() : 'Choose a time';
      select.appendChild(first);
      expected.forEach(function (time) {
        var opt = document.createElement('option');
        opt.value = time;
        opt.textContent = time;
        select.appendChild(opt);
      });
      if (expected.indexOf(current) !== -1) select.value = current;
      var msg = document.getElementById('availabilityMsg');
      if (msg) msg.textContent = 'Available start times: ' + expected.join(' • ');
    }
    updateTimeSelect();
    var date = document.getElementById('bdate');
    if (date) date.addEventListener('change', function () { setTimeout(updateTimeSelect, 150); });
    var time = document.getElementById('btime');
    if (time && window.MutationObserver) {
      var observer = new MutationObserver(function () { updateTimeSelect(); });
      observer.observe(time, { childList: true });
    }
    // Catch the original booking script if it rebuilds the select asynchronously.
    var attempts = 0;
    var timer = window.setInterval(function () {
      updateTimeSelect();
      attempts += 1;
      if (attempts >= 30) window.clearInterval(timer);
    }, 500);
  }
  function addSmsBookingOption() {
    var form = document.getElementById('bookingForm');
    var grid = form && form.querySelector('.channel-grid');
    if (!form || !grid) return;
    var button = grid.querySelector('[data-channel="sms"]');
    if (!button) {
      button = document.createElement('button');
      button.className = 'channel-btn';
      button.type = 'button';
      button.dataset.channel = 'sms';
      button.textContent = '📱 SMS';
      grid.insertBefore(button, grid.firstChild);
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
      grid.style.gap = '10px';
    }
    // Bind once; require the form details and design notes before opening SMS.
    if (button.dataset.validationReady) return;
    button.dataset.validationReady = 'true';
    button.addEventListener('click', function () {
      function field(id) { return document.getElementById(id); }
      function value(id) {
        var el = field(id);
        var direct = el && typeof el.value === 'string' ? el.value.trim() : '';
        // Some mobile/browser states can leave the expected ID empty while the visible textarea has text.
        if (id === 'btnote' && form && !direct) {
          var candidates = form.querySelectorAll('textarea, [contenteditable="true"]');
          for (var j = 0; j < candidates.length; j++) {
            var candidate = candidates[j];
            var candidateValue = typeof candidate.value === 'string'
              ? candidate.value.trim()
              : (candidate.textContent || '').trim();
            if (candidateValue) return candidateValue;
          }
        }
        return direct;
      }
      var required = [
        ['bname', 'Please enter your name.'],
        ['bphone', 'Please enter your mobile number.'],
        ['bemail', 'Please enter your email address.'],
        ['baddress', 'Please enter your address or barangay.'],
        ['bdate', 'Please choose an appointment date.'],
        ['btime', 'Please choose an appointment time.'],
        ['bservice', 'Please choose a service.'],
        ['blength', 'Please choose your nail length.'],
        ['bprevious', 'Please answer the previous nail work question.'],
        // Design/Inspo notes are optional for SMS; Gel can ask the customer about details by message.
      ];
      for (var i = 0; i < required.length; i++) {
        var el = field(required[i][0]);
        if (!el || !value(required[i][0])) {
          alert(required[i][1]);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
          return;
        }
      }
      var agree = field('policyAgree');
      if (agree && !agree.checked) {
        alert('Please read and agree to the Booking, Safety & Salon Policies before sending your request details.');
        agree.scrollIntoView({ behavior: 'smooth', block: 'center' });
        agree.focus();
        return;
      }
      var body = [
        'Hi Gel! I would like to enquire about a nail design and price.',
        '',
        'Name: ' + value('bname'),
        'Mobile: ' + value('bphone'),
        'Email: ' + value('bemail'),
        'Address/Barangay: ' + value('baddress'),
        'Preferred date (not booked): ' + value('bdate'),
        'Preferred time (not booked): ' + value('btime'),
        'Service: ' + value('bservice'),
        'Design/Inspo details: Please describe your preferred design when replying to Gel.',
        'Nail length: ' + value('blength'),
        'Previous nail work: ' + value('bprevious'),
        '',
        'This is an enquiry only, not an appointment request or confirmation. I understand I must submit the website booking form separately to request an appointment.'
      ].join('\n');
      window.location.href = 'sms:09553697737&body=' + encodeURIComponent(body);
    });
    var help = form.querySelector('.channel-help');
    var noticeText = 'SMS, Messenger, and Instagram are for design and price enquiries only. Sending a message through these options does NOT submit an appointment request or reserve a time. To request an appointment, complete the form and tap “Request Appointment Online.”';
    if (help) {
      help.textContent = noticeText;
      help.style.marginTop = '12px';
      help.style.fontSize = '0.9em';
      help.style.lineHeight = '1.5';
    } else {
      var notice = document.createElement('p');
      notice.className = 'channel-help';
      notice.textContent = noticeText;
      grid.insertAdjacentElement('afterend', notice);
    }
  }
  function handlePortfolioBookingDeepLink() {
    // Portfolio links open index.html with ?design=...&portfolio=1#booking.
    // Re-apply the booking anchor after the homepage sections/content finish moving.
    function scrollToBooking() {
      var params;
      try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
      if (params.get('portfolio') !== '1' || !params.get('design')) return;
      var booking = document.getElementById('booking');
      if (!booking) return;
      if (window.location.hash !== '#booking') history.replaceState(null, '', window.location.pathname + window.location.search + '#booking');
      booking.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    scrollToBooking();
    [150, 400, 800, 1400, 2200].forEach(function (delay) {
      window.setTimeout(scrollToBooking, delay);
    });
    window.addEventListener('load', scrollToBooking, { once: true });
  }
  function redirectBookingCTAs() {
    Array.from(document.querySelectorAll('a')).forEach(function (a) {
      var label = (a.textContent || '').replace(/\\s+/g, ' ').trim();
      if (/Book an Appointment/i.test(label) || /^Book Now$/i.test(label)) {
        a.setAttribute('href', '#booking');
        a.removeAttribute('target');
        a.removeAttribute('onclick');
        a.setAttribute('aria-label', 'Go to the online appointment request form');
      }
    });
    // Keep the compact navigation item labelled “Book” unchanged.
  }
  function refreshBookingContactOptions() {
    var form = document.getElementById('bookingForm');
    if (!form) return;
    // Remove the outdated Viber choice; online booking remains the main request method.
    form.querySelectorAll('[data-channel="viber"]').forEach(function (button) { button.remove(); });
    var grid = form.querySelector('.channel-grid');
    if (grid) {
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      grid.style.gap = '10px';
      var messenger = grid.querySelector('[data-channel="messenger"]');
      var instagram = grid.querySelector('[data-channel="instagram"]');
      if (messenger) { messenger.classList.add('primary'); messenger.style.order = '1'; }
      if (instagram) { instagram.classList.remove('primary'); instagram.style.order = '2'; }
    }
    var help = form.querySelector('.channel-help');
    if (help) help.textContent = 'Prefer messaging? Choose Messenger or Instagram to send Gel your appointment request. For the simplest option, use “Request Appointment Online” above.';
    // Replace any older wording elsewhere on the page that promises Viber booking.
    document.querySelectorAll('p, li').forEach(function (node) {
      if (/send the same request through Viber|Viber will open with your appointment details/i.test(node.textContent)) {
        node.textContent = 'Prefer messaging? Choose Messenger or Instagram to send Gel your appointment request, or submit the online booking form above.';
      }
    });
  }
  function refreshSocialLinks() {
    var socials = [
      { name: 'Instagram', url: 'https://www.instagram.com/naileditby_gel/', handle: '@naileditby_gel' },
      { name: 'Facebook', url: 'https://facebook.com/angel.joy.enderes.2025', handle: 'Naileditby_gel' },
      { name: 'TikTok', url: 'https://www.tiktok.com/@ngljy_ndrs', handle: '@ngljy_ndrs' }
    ];
    // TikTok is the social profile; customers should use the booking form to request appointments.
    document.querySelectorAll('a[href*="viber.com"], a[href^="viber:"]').forEach(function (a) {
      a.href = socials[2].url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', 'Visit Naileditby_gel on TikTok'); a.textContent = 'TikTok';
    });
    var footer = document.querySelector('footer');
    if (!footer) return;
    var old = footer.querySelector('#nailedit-social-links'); if (old) old.remove();
    var nav = document.createElement('nav'); nav.id = 'nailedit-social-links';
    nav.setAttribute('aria-label', 'Social media links');
    nav.innerHTML = '<p class="nailedit-social-heading">Follow Naileditby_gel</p><div class="nailedit-social-row">' +
      socials.map(function (s) { return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer" aria-label="' + s.name + ': ' + s.handle + '"><span class="nailedit-social-name">' + s.name + '</span><span class="nailedit-social-handle">' + s.handle + '</span></a>'; }).join('') + '</div>';
    footer.appendChild(nav);
    if (!document.getElementById('nailedit-social-style')) {
      var style = document.createElement('style'); style.id = 'nailedit-social-style';
      style.textContent = '#nailedit-social-links{max-width:980px;margin:24px auto 8px;padding:22px 18px 8px;text-align:center;border-top:1px solid rgba(111,41,68,.16)}#nailedit-social-links .nailedit-social-heading{font-family:"Playfair Display",Georgia,serif;color:var(--wine,#6f2944);font-size:1.35rem;margin:0 0 14px}#nailedit-social-links .nailedit-social-row{display:flex;justify-content:center;align-items:stretch;flex-wrap:wrap;gap:10px}#nailedit-social-links a{display:flex;flex-direction:column;gap:4px;min-width:130px;padding:12px 18px;border:1px solid rgba(233,109,154,.28);border-radius:14px;background:#fff;color:var(--wine,#6f2944);text-decoration:none;transition:transform .2s ease,box-shadow .2s ease}#nailedit-social-links a:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(111,41,68,.10)}#nailedit-social-links .nailedit-social-name{font-weight:600;font-size:.95rem}#nailedit-social-links .nailedit-social-handle{font-size:.8rem;color:#8b6c79;overflow-wrap:anywhere}@media(max-width:420px){#nailedit-social-links .nailedit-social-row{display:grid;grid-template-columns:1fr}#nailedit-social-links a{min-width:0}}';
      document.head.appendChild(style);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { reorderHomepageSections(); polishHeroPromoLink(); makeFooterMessageEvergreen(); refreshBusinessPolicies(); refreshFaq(); refreshBookingTimeSlots(); refreshBookingContactOptions(); addSmsBookingOption(); handlePortfolioBookingDeepLink(); redirectBookingCTAs(); refreshSocialLinks(); syncPublicContent(); });
  } else {
    reorderHomepageSections(); polishHeroPromoLink(); makeFooterMessageEvergreen(); refreshBusinessPolicies(); refreshFaq(); refreshBookingTimeSlots(); refreshBookingContactOptions(); addSmsBookingOption(); handlePortfolioBookingDeepLink(); redirectBookingCTAs(); refreshSocialLinks(); syncPublicContent();
  }
})();
