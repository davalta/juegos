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

  // evita menús de contexto / zoom de doble tap dentro del escenario
  var stage = document.getElementById('stage');
  stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  stage.addEventListener('dblclick', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  Shell.showHome();
})();
