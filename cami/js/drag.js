/* DragHelper — arrastrar con Pointer Events (mouse + touch unificados).
   Mueve el elemento real con transform:translate. Hit-test por centro del
   elemento dentro del rect del target inflado. Snap al acertar, rebote al fallar. */
var DragHelper = {
  make: function (el, opts) {
    opts = opts || {};
    var inflate = opts.inflate != null ? opts.inflate : 40;
    var startX = 0, startY = 0, dx = 0, dy = 0;
    var dragging = false, locked = false, pid = null;

    function onDown(e) {
      if (locked || dragging) return;
      dragging = true; pid = e.pointerId;
      startX = e.clientX; startY = e.clientY; dx = 0; dy = 0;
      try { el.setPointerCapture(pid); } catch (err) {}
      el.style.transition = 'none';
      el.classList.add('dragging');
      if (opts.onPickup) opts.onPickup(el);
      if (typeof Sound !== 'undefined') Sound.play('click');
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging || e.pointerId !== pid) return;
      dx = (e.clientX - startX) / Stage.scale;
      dy = (e.clientY - startY) / Stage.scale;
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.12)';
      e.preventDefault();
    }

    function onUp(e) {
      if (!dragging || e.pointerId !== pid) return;
      dragging = false;
      try { el.releasePointerCapture(pid); } catch (err) {}
      el.classList.remove('dragging');

      var hit = findTarget();
      if (hit && (!opts.accepts || opts.accepts(opts.data, hit.data))) {
        snapTo(hit);
      } else if (hit) {
        // target equivocado: rebote + wiggle del target
        if (opts.onWrong) opts.onWrong(el, hit);
        returnHome();
      } else {
        // soltó en vacío: regreso silencioso
        returnHome();
      }
      e.preventDefault();
    }

    function findTarget() {
      var targets = opts.getTargets ? opts.getTargets() : [];
      var er = el.getBoundingClientRect();
      var cx = er.left + er.width / 2, cy = er.top + er.height / 2;
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (!t.el) continue;
        var r = t.el.getBoundingClientRect();
        var inf = inflate * Stage.scale;
        if (cx >= r.left - inf && cx <= r.right + inf &&
            cy >= r.top - inf && cy <= r.bottom + inf) {
          return t;
        }
      }
      return null;
    }

    function snapTo(target) {
      locked = true;
      var er = el.getBoundingClientRect();
      var tr = target.el.getBoundingClientRect();
      var ecx = er.left + er.width / 2, ecy = er.top + er.height / 2;
      var tcx = tr.left + tr.width / 2, tcy = tr.top + tr.height / 2;
      var ndx = dx + (tcx - ecx) / Stage.scale;
      var ndy = dy + (tcy - ecy) / Stage.scale;
      el.style.transition = 'transform .18s cubic-bezier(.2,1.4,.4,1)';
      el.style.transform = 'translate(' + ndx + 'px,' + ndy + 'px) scale(1)';
      var done = false;
      var finish = function () {
        if (done) return; done = true;
        el.removeEventListener('transitionend', finish);
        if (opts.onCorrect) opts.onCorrect(el, target);
      };
      el.addEventListener('transitionend', finish);
      setTimeout(finish, 260); // respaldo si no dispara transitionend
    }

    function returnHome() {
      el.style.transition = 'transform .35s cubic-bezier(.3,1.3,.5,1)';
      el.style.transform = 'translate(0,0) scale(1)';
    }

    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    return {
      destroy: function () {
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
      },
      lock: function () { locked = true; }
    };
  }
};
