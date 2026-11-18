/**
 * Persistent user preferences backed by localStorage (dim preset, language,
 * section layout order, and mode group tile order).
 */
(function (global) {
  'use strict';

  var G5Quick = global.G5Quick = global.G5Quick || {};

  var DIM_MODES = [
    { key: 'paper', label: 'Paper' },
    { key: 'dim', label: 'Dim' },
    { key: 'ultra', label: 'Ultra' }
  ];

  var STORAGE_KEYS = {
    dim: 'g5quick_dim_mode',
    lang: 'g5quick_lang',
    brightnessStep: 'g5quick_brightness_step',
    sectionOrder: 'g5quick_section_order',
    groupOrder: 'g5quick_group_order'
  };

  var BRIGHTNESS_STEPS = [1, 5, 10, 20];
  var DEFAULT_SECTION_ORDER = ['hdmi', 'brightness', 'groups'];
  var DEFAULT_GROUP_ORDER = ['picture', 'sound', 'energy'];

  function isValidOrder(candidate, expected) {
    if (!Array.isArray(candidate) || candidate.length !== expected.length) return false;
    for (var i = 0; i < expected.length; i++) {
      if (candidate.indexOf(expected[i]) === -1) return false;
    }
    return true;
  }

  class PreferencesStore {
    constructor() {
      this.dimIndex = 0;
      this.lang = 'en';
      this.brightnessStep = 10;
      this.sectionOrder = DEFAULT_SECTION_ORDER.slice();
      this.groupOrder = DEFAULT_GROUP_ORDER.slice();
    }

    getDimMode() {
      return DIM_MODES[this.dimIndex];
    }

    setDimIndex(index) {
      this.dimIndex = ((index % DIM_MODES.length) + DIM_MODES.length) % DIM_MODES.length;
      var mode = this.getDimMode();
      this._writeStorage(STORAGE_KEYS.dim, mode.key);
      return mode;
    }

    cycleDimMode() {
      return this.setDimIndex(this.dimIndex + 1);
    }

    setLanguage(lang) {
      this.lang = lang === 'de' ? 'de' : 'en';
      this._writeStorage(STORAGE_KEYS.lang, this.lang);
      return this.lang;
    }

    setBrightnessStep(step) {
      var num = Number(step);
      this.brightnessStep = BRIGHTNESS_STEPS.indexOf(num) !== -1 ? num : 10;
      this._writeStorage(STORAGE_KEYS.brightnessStep, String(this.brightnessStep));
      return this.brightnessStep;
    }

    moveSection(idx, dir) {
      return this._moveOrderItem(this.sectionOrder, STORAGE_KEYS.sectionOrder, idx, dir);
    }

    moveGroup(idx, dir) {
      return this._moveOrderItem(this.groupOrder, STORAGE_KEYS.groupOrder, idx, dir);
    }

    restore() {
      var savedDim = this._readStorage(STORAGE_KEYS.dim);
      for (var i = 0; i < DIM_MODES.length; i++) {
        if (DIM_MODES[i].key === savedDim) {
          this.dimIndex = i;
          break;
        }
      }

      var savedLang = this._readStorage(STORAGE_KEYS.lang);
      if (savedLang === 'en' || savedLang === 'de') {
        this.lang = savedLang;
      }

      var savedStep = Number(this._readStorage(STORAGE_KEYS.brightnessStep));
      if (BRIGHTNESS_STEPS.indexOf(savedStep) !== -1) {
        this.brightnessStep = savedStep;
      }

      try {
        var savedSec = JSON.parse(this._readStorage(STORAGE_KEYS.sectionOrder) || 'null');
        if (isValidOrder(savedSec, DEFAULT_SECTION_ORDER)) {
          this.sectionOrder = savedSec;
        }
        var savedGrp = JSON.parse(this._readStorage(STORAGE_KEYS.groupOrder) || 'null');
        if (isValidOrder(savedGrp, DEFAULT_GROUP_ORDER)) {
          this.groupOrder = savedGrp;
        }
      } catch (_) {}
    }

    _moveOrderItem(order, storageKey, idx, dir) {
      var nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= order.length) return false;
      var tmp = order[idx];
      order[idx] = order[nextIdx];
      order[nextIdx] = tmp;
      this._writeStorage(storageKey, JSON.stringify(order));
      return true;
    }

    _readStorage(key) {
      try {
        return global.localStorage.getItem(key);
      } catch (_) {
        return null;
      }
    }

    _writeStorage(key, value) {
      try {
        global.localStorage.setItem(key, value);
      } catch (_) {}
    }
  }

  G5Quick.PreferencesStore = PreferencesStore;
})(window);
