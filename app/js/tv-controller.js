/**
 * TV state container and Luna Service Bus command controller.
 * Fetches picture, sound, energy, and HDMI status in parallel and applies
 * debounced or optimistic updates with automatic rollback on errors.
 */
(function (global) {
  'use strict';

  var G5Quick = global.G5Quick = global.G5Quick || {};

  var FALLBACK_INPUTS = [
    { id: 'HDMI_1', appId: 'com.webos.app.hdmi1', label: 'HDMI 1', connected: false },
    { id: 'HDMI_2', appId: 'com.webos.app.hdmi2', label: 'HDMI 2', connected: false },
    { id: 'HDMI_3', appId: 'com.webos.app.hdmi3', label: 'HDMI 3', connected: false },
    { id: 'HDMI_4', appId: 'com.webos.app.hdmi4', label: 'HDMI 4', connected: false }
  ];

  class TvController {
    constructor(options) {
      var opts = options || {};
      this.onChange = typeof opts.onChange === 'function' ? opts.onChange : function () {};

      this.state = {
        backlight: 50,
        pictureMode: '',
        pictureModes: global.SettingsMap.FALLBACK_PICTURE_MODES.slice(),
        energySaving: '',
        energyModes: global.SettingsMap.FALLBACK_ENERGY_MODES.slice(),
        soundMode: '',
        soundModes: global.SettingsMap.FALLBACK_SOUND_MODES.slice(),
        soundOutput: '',
        inputs: [],
        activeInputAppId: ''
      };

      this.backlightTimer = null;
      this.pendingBacklight = null;
    }

    static extractValuesArray(res) {
      if (!res) return [];
      var raw = [];
      if (res.values && Array.isArray(res.values.arrayExt)) {
        // webOS 25 arrayExt format: keep options visible/active for the current signal (SDR / HDR / DV)
        raw = res.values.arrayExt.filter(function (item) {
          return item && item.visible !== false && item.active !== false;
        });
        if (raw.length === 0) {
          raw = res.values.arrayExt;
        }
      } else if (Array.isArray(res.values)) {
        raw = res.values;
      } else if (Array.isArray(res.results) && res.results[0] && Array.isArray(res.results[0].values)) {
        raw = res.results[0].values;
      }

      return raw
        .map(function (item) {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') return item.value || item.key || '';
          return '';
        })
        .filter(Boolean);
    }

    commitBacklight(val) {
      return global.Luna.call('luna://com.webos.settingsservice', 'setSystemSettings', {
        category: 'picture',
        settings: { backlight: val }
      }).catch(function () {});
    }

    scheduleBacklight(val, immediate) {
      this.state.backlight = Math.max(0, Math.min(100, Math.round(val)));
      this._notify('backlight');

      if (immediate) {
        clearTimeout(this.backlightTimer);
        this.backlightTimer = null;
        this.pendingBacklight = null;
        this.commitBacklight(this.state.backlight);
        return;
      }

      // Coalesce rapid drag/input events into a single Luna call
      this.pendingBacklight = this.state.backlight;
      if (this.backlightTimer) return;
      var self = this;
      this.backlightTimer = setTimeout(function () {
        self.backlightTimer = null;
        if (self.pendingBacklight !== null) {
          var target = self.pendingBacklight;
          self.pendingBacklight = null;
          self.commitBacklight(target);
        }
      }, 85);
    }

    setPictureMode(mode) {
      var self = this;
      return this._applyModeSetting({
        stateKey: 'pictureMode',
        topic: 'picture',
        category: 'picture',
        settings: { pictureMode: mode },
        onSuccess: function () {
          // Reload brightness because each picture mode stores its own backlight value
          return self.loadPictureValues();
        }
      }, mode);
    }

    setEnergySaving(mode) {
      return this._applyModeSetting({
        stateKey: 'energySaving',
        topic: 'energy',
        category: 'picture',
        settings: {
          energySaving: mode,
          energySavingModified: 'true'
        }
      }, mode);
    }

    setSoundMode(mode) {
      return this._applyModeSetting({
        stateKey: 'soundMode',
        topic: 'sound',
        category: 'sound',
        settings: { soundMode: mode }
      }, mode);
    }

    switchHdmiInput(input, onSuccess) {
      this.state.activeInputAppId = input.appId;
      this._notify('inputs');

      return global.Luna.call('luna://com.webos.applicationManager', 'launch', {
        id: input.appId
      })
        .then(function () {
          if (typeof onSuccess === 'function') onSuccess();
        })
        .catch(function () {});
    }

    openLgSettings(onSuccess) {
      return global.Luna.call('luna://com.webos.applicationManager', 'launch', {
        id: 'com.palm.app.settings'
      })
        .then(function () {
          if (typeof onSuccess === 'function') onSuccess();
        })
        .catch(function () {});
    }

    loadPictureValues() {
      var self = this;
      return global.Luna.call('luna://com.webos.settingsservice', 'getSystemSettings', {
        category: 'picture',
        keys: ['backlight', 'pictureMode', 'energySaving']
      }).then(function (res) {
        var s = (res && res.settings) || {};
        if (s.backlight !== undefined) self.state.backlight = Number(s.backlight);
        if (s.pictureMode) self.state.pictureMode = s.pictureMode;
        if (s.energySaving) self.state.energySaving = s.energySaving;
        self._notify('pictureAll');
      });
    }

    loadAllSettings() {
      var self = this;

      var pPic = this.loadPictureValues().catch(function () {});

      var pPicList = this._loadSettingOptions('picture', 'pictureMode', 'pictureModes', 'picture');
      var pEnergyList = this._loadSettingOptions('picture', 'energySaving', 'energyModes', 'energy');
      var pSoundList = this._loadSettingOptions('sound', 'soundMode', 'soundModes', 'sound');

      var pSound = global.Luna.call('luna://com.webos.settingsservice', 'getSystemSettings', {
        category: 'sound',
        keys: ['soundMode', 'soundOutput']
      })
        .then(function (res) {
          var s = (res && res.settings) || {};
          if (s.soundMode) self.state.soundMode = s.soundMode;
          if (s.soundOutput) self.state.soundOutput = s.soundOutput;
          self._notify('sound');
        })
        .catch(function () {});

      var pEim = global.Luna.call('luna://com.webos.service.eim', 'getAllInputStatus', {})
        .then(function (res) {
          var devices = (res && res.devices) || [];
          var hdmiDevices = devices
            .filter(function (d) {
              return (d.id && d.id.indexOf('HDMI') === 0) || (d.appId && d.appId.indexOf('hdmi') !== -1);
            })
            .map(function (d) {
              return {
                id: d.id,
                appId: d.appId || ('com.webos.app.' + d.id.toLowerCase().replace('_', '')),
                label: d.label || d.id.replace('_', ' '),
                connected: Boolean(d.connected)
              };
            });

          if (hdmiDevices.length > 0) {
            self.state.inputs = hdmiDevices;
          }
        })
        .catch(function () {
          self.state.inputs = FALLBACK_INPUTS.slice();
        });

      var pFg = global.Luna.call('luna://com.webos.applicationManager', 'getForegroundAppInfo', {})
        .then(function (res) {
          if (res && res.appId && res.appId.indexOf('hdmi') !== -1) {
            self.state.activeInputAppId = res.appId;
          }
        })
        .catch(function () {});

      return Promise.all([pPic, pPicList, pEnergyList, pSound, pSoundList, pEim, pFg]).then(function () {
        self._notify('inputs');
      });
    }

    _notify(topic) {
      this.onChange(topic, this.state);
    }

    _applyModeSetting(cfg, mode) {
      var self = this;
      var prev = this.state[cfg.stateKey];
      this.state[cfg.stateKey] = mode;
      this._notify(cfg.topic);

      return global.Luna.call('luna://com.webos.settingsservice', 'setSystemSettings', {
        category: cfg.category,
        settings: cfg.settings
      })
        .then(function () {
          if (typeof cfg.onSuccess === 'function') {
            return cfg.onSuccess();
          }
        })
        .catch(function () {
          self.state[cfg.stateKey] = prev;
          self._notify(cfg.topic);
        });
    }

    _loadSettingOptions(category, key, listKey, topic) {
      var self = this;
      return global.Luna.call('luna://com.webos.settingsservice', 'getSystemSettingValues', {
        category: category,
        key: key
      })
        .then(function (res) {
          var vals = TvController.extractValuesArray(res);
          if (vals.length > 0) {
            self.state[listKey] = vals;
            self._notify(topic);
          }
        })
        .catch(function () {});
    }
  }

  G5Quick.TvController = TvController;
})(window);
