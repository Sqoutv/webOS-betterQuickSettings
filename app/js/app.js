/**
 * Application coordinator for G5 Quick Settings.
 * Connects PreferencesStore, OverlayView, TvController, and SpatialNavigator,
 * binds DOM events, and manages the webOS keepAlive warm-relaunch lifecycle.
 */
(function (global) {
  'use strict';

  const G5Quick = global.G5Quick = global.G5Quick || {};

  class QuickSettingsApp {
    constructor() {
      this.prefs = new G5Quick.PreferencesStore();

      this.tv = new G5Quick.TvController({
        onChange: (topic, state) => this.handleTvStateChange(topic, state)
      });

      this.view = new G5Quick.OverlayView({
        focusElement: (el) => this.navigator.focusElement(el),
        onSelectPictureMode: (mode) => this.selectMode(() => this.tv.setPictureMode(mode)),
        onSelectEnergySaving: (mode) => this.selectMode(() => this.tv.setEnergySaving(mode)),
        onSelectSoundMode: (mode) => this.selectMode(() => this.tv.setSoundMode(mode)),
        onSelectHdmiInput: (input) => this.tv.switchHdmiInput(input, () => this.dismissOverlay()),
        onMoveSection: (idx, dir, key) => this.handleMoveSection(idx, dir, key),
        onMoveGroup: (idx, dir, key) => this.handleMoveGroup(idx, dir, key)
      });

      this.navigator = new G5Quick.SpatialNavigator({
        panelEl: this.view.els.panel,
        backlightTrackEl: this.view.els.backlightTrack,
        rangeBacklightEl: this.view.els.rangeBacklight,
        onAdjustBacklight: (dirSign) => this.tv.scheduleBacklight(this.tv.state.backlight + dirSign * this.prefs.brightnessStep, true),
        onBackPressed: () => this.handleBackPressed()
      });

      this.lastWakeMs = Date.now();
      this.isHidden = false;
    }

    selectMode(applyFn) {
      this.view.closeGroupDrawer(true);
      applyFn();
    }

    handleTvStateChange(topic, tvState) {
      if (topic === 'backlight') {
        this.view.renderBacklight(tvState.backlight);
      } else if (topic === 'picture') {
        this.view.renderPictureModes(tvState);
      } else if (topic === 'energy') {
        this.view.renderEnergyModes(tvState);
      } else if (topic === 'sound') {
        this.view.renderSoundModes(tvState);
      } else if (topic === 'inputs') {
        this.view.renderInputs(tvState);
      } else if (topic === 'pictureAll') {
        this.view.renderBacklight(tvState.backlight);
        this.view.renderPictureModes(tvState);
        this.view.renderEnergyModes(tvState);
      }
    }

    handleMoveSection(idx, dir, key) {
      if (!this.prefs.moveSection(idx, dir)) return;
      this.view.applySectionOrder(this.prefs.sectionOrder);
      this.view.renderOrderLists(this.prefs);
      this.view.focusMovedOrderButton('section', key, dir);
    }

    handleMoveGroup(idx, dir, key) {
      if (!this.prefs.moveGroup(idx, dir)) return;
      this.view.applyGroupOrder(this.prefs.groupOrder);
      this.view.renderOrderLists(this.prefs);
      this.view.focusMovedOrderButton('group', key, dir);
    }

    handleBackPressed() {
      if (this.view.configOpen) {
        this.view.closeConfigDrawer(true);
      } else if (this.view.openGroup !== null) {
        this.view.closeGroupDrawer(true);
      } else {
        this.dismissOverlay();
      }
    }

    dismissOverlay() {
      this.view.closeGroupDrawer(false);
      this.view.closeConfigDrawer(false);
      if (!global.Luna.isWebOS) return;
      this.isHidden = true;
      global.Luna.hideSelf();
    }

    onWakeUp(force) {
      if (!force && !this.isHidden) return;
      const now = Date.now();
      if (now - this.lastWakeMs < 350) return;
      this.lastWakeMs = now;
      this.isHidden = false;

      global.Luna.activateSelf();
      this.view.showPanel();
      this.navigator.focusElement(this.view.els.rangeBacklight);
      this.tv.loadAllSettings();
    }

    bindEvents() {
      const els = this.view.els;

      els.backdrop.addEventListener('click', () => this.dismissOverlay());
      els.btnClose.addEventListener('click', () => this.dismissOverlay());
      els.btnLgSettings.addEventListener('click', () => this.tv.openLgSettings(() => this.dismissOverlay()));
      els.btnConfig.addEventListener('click', () => this.view.openConfigDrawer(this.prefs));
      els.btnRefresh.addEventListener('click', () => this.tv.loadAllSettings());
      els.btnDim.addEventListener('click', () => this.view.applyDimMode(this.prefs.cycleDimMode()));

      els.btnLangEn.addEventListener('click', () => {
        this.prefs.setLanguage('en');
        this.view.applyLocalization(this.prefs, this.tv.state);
      });
      els.btnLangDe.addEventListener('click', () => {
        this.prefs.setLanguage('de');
        this.view.applyLocalization(this.prefs, this.tv.state);
      });

      [[els.btnStep1, 1], [els.btnStep5, 5], [els.btnStep10, 10], [els.btnStep20, 20]].forEach(([btn, step]) => {
        btn.addEventListener('click', () => {
          this.prefs.setBrightnessStep(step);
          this.view.renderBrightnessStep(this.prefs.brightnessStep);
        });
      });

      els.rangeBacklight.addEventListener('input', () => {
        this.tv.scheduleBacklight(Number(els.rangeBacklight.value), false);
      });
      els.rangeBacklight.addEventListener('change', () => {
        this.tv.scheduleBacklight(Number(els.rangeBacklight.value), true);
      });

      els.groupBtnPicture.addEventListener('click', () => this.view.openGroupDrawer('picture', this.tv.state));
      els.groupBtnSound.addEventListener('click', () => this.view.openGroupDrawer('sound', this.tv.state));
      els.groupBtnEnergy.addEventListener('click', () => this.view.openGroupDrawer('energy', this.tv.state));

      document.addEventListener('keydown', (e) => this.navigator.handleKeyDown(e));

      // Keep WebAppMgr warm in memory and refresh state cleanly on relaunch
      global.addEventListener('webOSRelaunch', () => this.onWakeUp(true));
      document.addEventListener('webOSRelaunch', () => this.onWakeUp(true));
      global.addEventListener('focus', () => this.onWakeUp(false));
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.onWakeUp(false);
      });
    }

    start() {
      this.view.setDemoMode(!global.Luna.isWebOS);
      this.prefs.restore();
      this.view.applyDimMode(this.prefs.getDimMode());
      this.view.applySectionOrder(this.prefs.sectionOrder);
      this.view.applyGroupOrder(this.prefs.groupOrder);
      this.bindEvents();

      this.view.renderBacklight(this.tv.state.backlight);
      this.view.applyLocalization(this.prefs, this.tv.state);

      global.requestAnimationFrame(() => {
        this.view.showPanel();
        this.navigator.focusElement(this.view.els.rangeBacklight);
      });

      this.tv.loadAllSettings();
    }
  }

  G5Quick.QuickSettingsApp = QuickSettingsApp;
  new QuickSettingsApp().start();
})(window);
