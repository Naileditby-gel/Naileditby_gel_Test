(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  let installPrompt = null;
  const installButton = document.getElementById('installButton');

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installButton.hidden = true;
    });
  }

  window.addEventListener('appinstalled', () => {
    if (installButton) installButton.hidden = true;
    installPrompt = null;
  });

  document.querySelectorAll('[data-current-status]').forEach(link => {
    link.href = location.pathname + location.search + location.hash;
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(error => {
        console.warn('App offline support could not be enabled:', error);
      });
    });
  }
})();