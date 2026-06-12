/* main.js — arranque de la app. */
(function () {
  Save.load();
  Sound.setMuted(Save.muted);
  Voz.setMuted(Save.muted);
  Voz.init();

  Stage.init();
  Confetti.init(document.getElementById('fx'));
  Shell.init();

  // muestra el overlay de "gira el teléfono" (estaba hidden para evitar parpadeo)
  var rot = document.getElementById('rotate-overlay');
  if (rot) rot.removeAttribute('hidden');

  // desbloqueo de audio + voz en el primer gesto
  function unlock() {
    Sound.unlock();
    Voz.prime();
    if (Sound.ready()) {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
    }
  }
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('touchstart', unlock);

  // si la pestaña se oculta/minimiza: callar la voz y pausar el audio (evita que
  // un tab en segundo plano siga sonando o "hablando solo")
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      Voz.cancel();
      try { if (Sound.ctx && Sound.ctx.state === 'running') Sound.ctx.suspend(); } catch (e) {}
    } else {
      try { if (Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume(); } catch (e) {}
    }
  });
  // al cerrar la pestaña, cancela cualquier voz pendiente
  window.addEventListener('pagehide', function () { Voz.cancel(); });

  // evita menús de contexto / zoom de doble tap dentro del escenario
  var stage = document.getElementById('stage');
  stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  stage.addEventListener('dblclick', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  Shell.showHome();
})();
