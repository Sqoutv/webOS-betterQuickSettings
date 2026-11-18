/**
 * 2D spatial D-Pad / keyboard focus controller for Magic Remote and desktop preview.
 * Handles bounding-box candidate scoring, direct brightness steps on the slider,
 * and webOS Back (461) / Escape key interception.
 */
(function (global) {
  'use strict';

  var G5Quick = global.G5Quick = global.G5Quick || {};

  var KEY_CODES = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ESCAPE: 27,
    WEBOS_BACK: 461
  };

  class SpatialNavigator {
    constructor(options) {
      var opts = options || {};
      this.panelEl = opts.panelEl;
      this.backlightTrackEl = opts.backlightTrackEl;
      this.rangeBacklightEl = opts.rangeBacklightEl;
      this.onAdjustBacklight = typeof opts.onAdjustBacklight === 'function' ? opts.onAdjustBacklight : function () {};
      this.onBackPressed = typeof opts.onBackPressed === 'function' ? opts.onBackPressed : function () {};
    }

    getFocusableElements() {
      return Array.prototype.slice.call(this.panelEl.querySelectorAll('.focusable')).filter(function (el) {
        return el.offsetParent !== null && !el.disabled;
      });
    }

    focusElement(el) {
      if (!el) return;
      var focused = this.panelEl.querySelectorAll('.focusable.is-focused');
      for (var i = 0; i < focused.length; i++) {
        focused[i].classList.remove('is-focused');
      }
      el.classList.add('is-focused');
      if (this.backlightTrackEl) {
        this.backlightTrackEl.classList.toggle('is-focused', el === this.rangeBacklightEl);
      }
      el.focus({ preventScroll: false });
    }

    moveFocusDirectional(direction) {
      var items = this.getFocusableElements();
      if (!items.length) return;

      var current = document.activeElement;
      if (items.indexOf(current) === -1) {
        this.focusElement(this.rangeBacklightEl);
        return;
      }

      // Left / Right on the brightness slider adjusts OLED brightness by the configured step
      if (current === this.rangeBacklightEl && (direction === 'left' || direction === 'right')) {
        this.onAdjustBacklight(direction === 'right' ? 1 : -1);
        return;
      }

      var curRect = current.getBoundingClientRect();
      var curCx = curRect.left + curRect.width / 2;
      var curCy = curRect.top + curRect.height / 2;

      var best = null;
      var bestScore = Infinity;

      for (var i = 0; i < items.length; i++) {
        var cand = items[i];
        if (cand === current) continue;
        // Keep vertical D-Pad navigation on row items; users press Right to reach reorder arrows
        if ((direction === 'up' || direction === 'down') && cand.classList.contains('order-btn')) {
          continue;
        }
        var r = cand.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = cx - curCx;
        var dy = cy - curCy;

        var valid = false;
        var primary = 0;
        var secondary = 0;
        var isVertical = false;
        // Measure horizontal distance to the target bounding box so wide rows stay favored
        var horizDistToBox = curCx < r.left ? (r.left - curCx) : (curCx > r.right ? (curCx - r.right) : 0);

        if (direction === 'left' && dx < -6 && Math.abs(dy) < 95) {
          valid = true;
          primary = Math.abs(dx);
          secondary = Math.abs(dy);
        } else if (direction === 'right' && dx > 6 && Math.abs(dy) < 95) {
          valid = true;
          primary = Math.abs(dx);
          secondary = Math.abs(dy);
        } else if (direction === 'up' && dy < -8) {
          valid = true;
          isVertical = true;
          primary = Math.abs(dy);
          secondary = horizDistToBox;
        } else if (direction === 'down' && dy > 8) {
          valid = true;
          isVertical = true;
          primary = Math.abs(dy);
          secondary = horizDistToBox;
        }

        if (valid) {
          var score = isVertical ? (primary * 3.0 + secondary) : (primary + secondary * 2.2);
          if (score < bestScore) {
            bestScore = score;
            best = cand;
          }
        }
      }

      if (best) {
        this.focusElement(best);
      }
    }

    handleKeyDown(e) {
      var code = e.keyCode || e.which;

      if (code === KEY_CODES.WEBOS_BACK || code === KEY_CODES.ESCAPE) {
        e.preventDefault();
        this.onBackPressed();
        return;
      }

      if (code === KEY_CODES.LEFT) {
        e.preventDefault();
        this.moveFocusDirectional('left');
      } else if (code === KEY_CODES.RIGHT) {
        e.preventDefault();
        this.moveFocusDirectional('right');
      } else if (code === KEY_CODES.UP) {
        e.preventDefault();
        this.moveFocusDirectional('up');
      } else if (code === KEY_CODES.DOWN) {
        e.preventDefault();
        this.moveFocusDirectional('down');
      }
    }
  }

  G5Quick.SpatialNavigator = SpatialNavigator;
})(window);
