(() => {
  const banner = document.getElementById('appInstallBanner');
  const installButton = document.getElementById('appInstallButton');
  const dismissButton = document.getElementById('appInstallDismiss');
  const help = document.getElementById('appInstallHelp');
  if (!banner || !installButton) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const dismissed = (() => {
    try { return localStorage.getItem('nailedit-app-install-dismissed') === '1'; }
    catch (_) { return false; }
  })();

  if (isStandalone || dismissed) {
    banner.hidden = true;
    return;
  }

  let deferredPrompt = null;
  const showHelp = message => {
    help.textContent = message;
    help.classList.add('is-visible');
  };

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.textContent = '♡ Install the app';
  });

  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (_) {}
      deferredPrompt = null;
      return;
    }

    if (isIOS) {
      showHelp('To install on iPhone or iPad: open this website in Safari, tap the Share button, then choose “Add to Home Screen”.');
    } else {
      showHelp('If your browser supports installation, open its menu (⋮) and choose “Install app” or “Add to Home screen”.');
    }
  });

  dismissButton?.addEventListener('click', () => {
    banner.hidden = true;
    try { localStorage.setItem('nailedit-app-install-dismissed', '1'); } catch (_) {}
  });

  window.addEventListener('appinstalled', () => { banner.hidden = true; });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(error => {
        console.warn('App installation support could not register offline resources:', error);
      });
    });
  }
})();