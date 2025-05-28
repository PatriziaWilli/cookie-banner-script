(function () {
  const scriptTag  = document.currentScript;
  const siteId     = scriptTag.dataset.siteId;
  const token      = scriptTag.dataset.token;
  const COOKIE_NAME = 'cookie_consent';

  if (!siteId || !token) return;

  const apiUrl = `https://brave-connection-f862697dcf.strapiapp.com/api/clients/${siteId}?populate=cookies`;

  let allCategories = [];
  let lastCookies   = [];

  function readConsent() {
    const match = document.cookie.match(
      new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)')
    );
    if (match) {
      try {
        const val = JSON.parse(decodeURIComponent(match[2]));
        console.log("Leggo cookie_consent:", val);
        return val;
      } catch {
        console.warn("Errore parsing cookie_consent");
        return null;
      }
    }
    console.log("cookie_consent non trovato");
    return null;
  }

  function writeConsent(categories) {
    console.log("Scrivo cookie_consent con:", categories);
    const value   = encodeURIComponent(JSON.stringify(categories));
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie =
      `${COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  function loadScriptsByCategory(category) {
    document
      .querySelectorAll(`script[data-cookie-placeholder="${category}"]`)
      .forEach(ph => {
        if (ph.dataset.loaded === 'true') return;
        const ns = document.createElement('script');
        ns.type = 'text/javascript';
        if (ph.src)       ns.src       = ph.src;
        if (ph.async)     ns.async     = true;
        if (ph.defer)     ns.defer     = true;
        if (ph.textContent) ns.textContent = ph.textContent;
        ph.dataset.loaded = 'true';
        ph.parentNode.replaceChild(ns, ph);
      });
  }

  function blockScriptsByCategory(category) {
    document
      .querySelectorAll(`script[data-cookie-category="${category}"]`)
      .forEach(s => s.parentNode.removeChild(s));
  }

  function updateScripts(consentCategories) {
    allCategories.forEach(cat => {
      if (consentCategories.includes(cat)) {
        loadScriptsByCategory(cat);
      } else if (cat !== 'essential') {
        blockScriptsByCategory(cat);
      }
    });
  }

  function createPersistentButton() {
    let btn = document.getElementById('cookie-settings-button');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'cookie-settings-button';
      btn.textContent = 'Modifica preferenze cookie';
      Object.assign(btn.style, {
        position:   'fixed',
        bottom:     '15px',
        right:      '15px',
        zIndex:     '10000',
        background: '#222',
        color:      'white',
        border:     'none',
        padding:    '10px 15px',
        borderRadius: '5px',
        cursor:     'pointer',
        fontFamily: 'Arial, sans-serif',
        fontSize:   '14px',
        boxShadow:  '0 2px 6px rgba(0,0,0,0.3)'
      });
      btn.onclick = showCustomizePanel;
      document.body.appendChild(btn);
    } else {
      btn.style.display = 'block';
    }
  }

  function createCookieBanner(cookies) {
    lastCookies = cookies;

    allCategories = [...new Set(cookies.map(c => c.category))];
    if (!allCategories.includes('essential')) {
      allCategories.unshift('essential');
    }

    const small = document.getElementById('cookie-settings-button');
    if (small) small.style.display = 'none';

    const old = document.getElementById('cookie-banner');
    if (old) old.remove();

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    Object.assign(banner.style, {
      position:        'fixed',
      bottom:          '0',
      left:            '0',
      right:           '0',
      background:      '#222',
      color:           'white',
      padding:         '15px',
      fontFamily:      'Arial, sans-serif',
      zIndex:          '9999',
      display:         'flex',
      justifyContent:  'space-between',
      alignItems:      'center',
      flexWrap:        'wrap',
    });

    const text = document.createElement('div');
    text.innerText = 'Questo sito usa cookie. Gestisci le tue preferenze.';

    const btns = document.createElement('div');
    const acceptAll = document.createElement('button');
    acceptAll.innerText = 'Accetta tutti';
    acceptAll.style.marginRight = '10px';
    acceptAll.onclick = () => {
      writeConsent(allCategories);
      updateScripts(allCategories);
      banner.remove();
      createPersistentButton();
    };

    const rejectNon = document.createElement('button');
    rejectNon.innerText = 'Rifiuta non essenziali';
    rejectNon.style.marginRight = '10px';
    rejectNon.onclick = () => {
      writeConsent(['essential']);
      updateScripts(['essential']);
      banner.remove();
      createPersistentButton();
    };

    const customize = document.createElement('button');
    customize.innerText = 'Personalizza';
    customize.onclick = showCustomizePanel;

    btns.append(acceptAll, rejectNon, customize);
    banner.append(text, btns);
    document.body.appendChild(banner);
  }

  function showCustomizePanel() {
    const oldBanner = document.getElementById('cookie-banner');
    if (oldBanner) oldBanner.remove();
    const small = document.getElementById('cookie-settings-button');
    if (small) small.style.display = 'none';

    const saved = readConsent() || ['essential'];

    const panel = document.createElement('div');
    panel.id = 'cookie-banner';
    Object.assign(panel.style, {
      position:        'fixed',
      bottom:          '0',
      left:            '0',
      right:           '0',
      background:      '#222',
      color:           'white',
      padding:         '15px',
      fontFamily:      'Arial, sans-serif',
      zIndex:          '9999',
    });

    const title = document.createElement('div');
    title.innerText = 'Seleziona le categorie di cookie che accetti:';
    title.style.marginBottom = '10px';

    const form = document.createElement('form');
    allCategories.forEach(cat => {
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.marginBottom = '5px';

      const cb = document.createElement('input');
      cb.type     = 'checkbox';
      cb.name     = 'cookie-category';
      cb.value    = cat;
      cb.disabled = (cat === 'essential');
      cb.checked  = (cat === 'essential' || saved.includes(cat));

      label.append(cb, document.createTextNode(' ' + cat));
      form.append(label);
    });

    const save = document.createElement('button');
    save.type = 'submit';
    save.innerText = 'Salva preferenze';
    save.style.marginTop = '10px';
    form.append(save);

    panel.append(title, form);
    document.body.appendChild(panel);

    form.onsubmit = e => {
      e.preventDefault();
      const checked = Array.from(form.elements['cookie-category'])
        .filter(i => i.checked)
        .map(i => i.value);
      if (!checked.includes('essential')) checked.unshift('essential');

      writeConsent(checked);
      updateScripts(checked);
      panel.remove();
      createPersistentButton();
    };
  }

  fetch(apiUrl)
    .then(r => r.json())
    .then(json => {
      const client = json.data;
      if (!client) {
        console.warn('Client non trovato nella risposta');
        return;
      }
      if (client.token !== token) {
        console.warn('Client non autorizzato o token errato.');
        return;
      }

      const cookies = client.cookies || [];
      console.log('✅ Banner attivato per:', siteId, '📦 Cookies:', cookies);

      allCategories = [...new Set(cookies.map(c => c.category))];
      if (!allCategories.includes('essential')) {
        allCategories.unshift('essential');
      }

      const saved = readConsent();

      if (!saved || !Array.isArray(saved)) {
        createCookieBanner(cookies);
      } else {
        updateScripts(saved);
        createPersistentButton();
      }
    })
    .catch(err => console.error('Errore di fetch:', err));
})();
