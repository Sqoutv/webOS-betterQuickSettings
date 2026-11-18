/**
 * DOM view manager for G5 Quick Settings overlay panel.
 */
(function (global) {
  'use strict';

  const G5Quick = global.G5Quick = global.G5Quick || {};

  const ORDER_POINTS = { up: '6 15 12 9 18 15', down: '6 9 12 15 18 9', left: '15 6 9 12 15 18', right: '9 6 15 12 9 18' };
  const STEP_BTNS = [[1, 'btnStep1'], [5, 'btnStep5'], [10, 'btnStep10'], [20, 'btnStep20']];
  const TOOLTIP_MAP = { btnLgSettings: 'lgSettingsTitle', btnConfig: 'configBtnTitle', btnDim: 'dimBtnTitle', btnRefresh: 'refreshBtnTitle', btnClose: 'closeBtnTitle' };

  const TEXT_MAP = {
    lblHdmi: 'hdmiTitle', lblBacklight: 'brightnessTitle', titleGroupPicture: 'pictureTitle', titleGroupSound: 'soundTitle',
    titleGroupEnergy: 'energyTitle', lblAudioOut: 'audioOut', lblConfigTitle: 'configTitle', lblConfigLang: 'langTitle',
    lblConfigStep: 'stepTitle', lblConfigSecOrder: 'secOrderTitle', lblConfigGrpOrder: 'grpOrderTitle'
  };

  const GROUPS = {
    picture: { titleKey: 'pictureTitle', btnEl: 'groupBtnPicture', list: 'pictureModes', val: 'pictureMode', valEl: 'valPictureMode', gridEl: 'gridPictureMode', labels: 'PICTURE_MODE_LABELS', cb: 'onSelectPictureMode' },
    sound: { titleKey: 'soundTitle', btnEl: 'groupBtnSound', list: 'soundModes', val: 'soundMode', valEl: 'valSound', gridEl: 'gridSound', labels: 'SOUND_MODE_LABELS', cb: 'onSelectSoundMode' },
    energy: { titleKey: 'energyTitle', btnEl: 'groupBtnEnergy', list: 'energyModes', val: 'energySaving', valEl: 'valEnergy', gridEl: 'gridEnergy', labels: 'ENERGY_SAVING_LABELS', cb: 'onSelectEnergySaving' }
  };

  class OverlayView {
    constructor(options) {
      this.callbacks = options || {};
      this.focusElement = typeof this.callbacks.focusElement === 'function' ? this.callbacks.focusElement : () => {};
      this.configOpen = false;
      this.openGroup = null;
      this.lang = 'en';

      this.els = {
        panel: document.getElementById('panel'),
        backdrop: document.getElementById('backdrop'),
        demoBadge: document.getElementById('demo-badge'),
        btnLgSettings: document.getElementById('btn-lg-settings'),
        btnConfig: document.getElementById('btn-config'),
        btnDim: document.getElementById('btn-dim'),
        dimLabel: document.getElementById('dim-label'),
        btnRefresh: document.getElementById('btn-refresh'),
        btnClose: document.getElementById('btn-close'),
        configDrawer: document.getElementById('config-drawer'),
        lblConfigTitle: document.getElementById('lbl-config-title'),
        lblConfigLang: document.getElementById('lbl-config-lang'),
        btnLangDe: document.getElementById('btn-lang-de'),
        btnLangEn: document.getElementById('btn-lang-en'),
        lblConfigStep: document.getElementById('lbl-config-step'),
        btnStep1: document.getElementById('btn-step-1'),
        btnStep5: document.getElementById('btn-step-5'),
        btnStep10: document.getElementById('btn-step-10'),
        btnStep20: document.getElementById('btn-step-20'),
        lblConfigSecOrder: document.getElementById('lbl-config-sec-order'),
        listSectionOrder: document.getElementById('list-section-order'),
        lblConfigGrpOrder: document.getElementById('lbl-config-grp-order'),
        listGroupOrder: document.getElementById('list-group-order'),
        sectionsContainer: document.getElementById('sections-container'),
        secHdmi: document.getElementById('sec-hdmi'),
        secBrightness: document.getElementById('sec-brightness'),
        secGroups: document.getElementById('sec-groups'),
        groupsGrid: document.getElementById('groups-grid'),
        lblHdmi: document.getElementById('lbl-hdmi'),
        lblBacklight: document.getElementById('lbl-backlight'),
        backlightTrack: document.getElementById('backlight-track'),
        backlightFill: document.getElementById('backlight-fill'),
        rangeBacklight: document.getElementById('range-backlight'),
        valBacklight: document.getElementById('val-backlight'),
        titleGroupPicture: document.getElementById('title-group-picture'),
        titleGroupSound: document.getElementById('title-group-sound'),
        titleGroupEnergy: document.getElementById('title-group-energy'),
        valPictureMode: document.getElementById('val-picture-mode'),
        gridPictureMode: document.getElementById('grid-picture-mode'),
        valEnergy: document.getElementById('val-energy'),
        gridEnergy: document.getElementById('grid-energy'),
        valSound: document.getElementById('val-sound'),
        gridSound: document.getElementById('grid-sound'),
        soundOutWrap: document.getElementById('sound-out-wrap'),
        lblAudioOut: document.getElementById('lbl-audio-out'),
        valSoundOut: document.getElementById('val-sound-out'),
        valHdmi: document.getElementById('val-hdmi'),
        gridHdmi: document.getElementById('grid-hdmi'),
        groupBtnPicture: document.getElementById('group-btn-picture'),
        groupBtnSound: document.getElementById('group-btn-sound'),
        groupBtnEnergy: document.getElementById('group-btn-energy'),
        groupDrawer: document.getElementById('group-drawer'),
        drawerTitle: document.getElementById('drawer-title')
      };
    }

    setDemoMode(enabled) { this.els.demoBadge.classList.toggle('hidden', !enabled); }
    showPanel() { this.els.panel.classList.add('is-visible'); }
    applyDimMode(mode) { document.body.setAttribute('data-dim', mode.key); this.els.dimLabel.textContent = mode.label; }

    applySectionOrder(order) { this._applyDomOrder(this.els.sectionsContainer, order, { hdmi: this.els.secHdmi, brightness: this.els.secBrightness, groups: this.els.secGroups }); }
    applyGroupOrder(order) { this._applyDomOrder(this.els.groupsGrid, order, { picture: this.els.groupBtnPicture, sound: this.els.groupBtnSound, energy: this.els.groupBtnEnergy }); }

    applyLocalization(prefs, tvState) {
      const t = global.SettingsMap.t;
      this.lang = prefs.lang;
      document.documentElement.lang = this.lang;
      this.els.panel.setAttribute('aria-label', t('panelAria', this.lang));
      this.els.rangeBacklight.setAttribute('aria-label', t('brightnessTitle', this.lang));

      Object.keys(TOOLTIP_MAP).forEach((k) => {
        const label = t(TOOLTIP_MAP[k], this.lang);
        this.els[k].title = label;
        this.els[k].setAttribute('aria-label', label);
      });
      Object.keys(TEXT_MAP).forEach((k) => { this.els[k].textContent = t(TEXT_MAP[k], this.lang); });

      this.els.btnLangDe.classList.toggle('is-active', this.lang === 'de');
      this.els.btnLangEn.classList.toggle('is-active', this.lang === 'en');
      if (this.openGroup && GROUPS[this.openGroup]) this.els.drawerTitle.textContent = t(GROUPS[this.openGroup].titleKey, this.lang);

      this.renderBrightnessStep(prefs.brightnessStep);
      this.renderPictureModes(tvState);
      this.renderEnergyModes(tvState);
      this.renderSoundModes(tvState);
      this.renderInputs(tvState);
      this.renderOrderLists(prefs);
    }

    renderBrightnessStep(step) {
      STEP_BTNS.forEach(([val, key]) => this.els[key].classList.toggle('is-active', step === val));
    }

    renderBacklight(backlight) {
      const val = Math.max(0, Math.min(100, Number(backlight) || 0));
      this.els.rangeBacklight.value = String(val);
      this.els.backlightFill.style.width = val + '%';
      this.els.valBacklight.textContent = val + ' %';
    }

    renderPictureModes(tvState) { this._renderModeGroup('picture', tvState); }
    renderEnergyModes(tvState) { this._renderModeGroup('energy', tvState); }

    renderSoundModes(tvState) {
      this._renderModeGroup('sound', tvState);
      if (tvState.soundOutput) {
        this.els.valSoundOut.textContent = global.SettingsMap.getLabel(global.SettingsMap.SOUND_OUT_LABELS, tvState.soundOutput, this.lang);
      }
      this.els.soundOutWrap.classList.toggle('hidden', !(tvState.soundOutput && this.openGroup === 'sound'));
    }

    renderInputs(tvState) {
      const active = tvState.inputs.find((d) => d.appId === tvState.activeInputAppId);
      this.els.valHdmi.textContent = active ? active.label : global.SettingsMap.t('hdmiSelect', this.lang);

      this._syncButtonGrid(
        this.els.gridHdmi,
        tvState.inputs,
        (btn, inp) => btn.dataset.appid === inp.appId && btn.querySelector('.pill-label').textContent === (inp.label || inp.id),
        (inp) => this._btn('hdmi-btn focusable', { appid: inp.appId }, () => this.callbacks.onSelectHdmiInput && this.callbacks.onSelectHdmiInput(inp), [this._el('span', 'dot'), this._el('span', 'pill-label', inp.label || inp.id)]),
        (btn, inp) => {
          btn.classList.toggle('is-active', inp.appId === tvState.activeInputAppId);
          btn.querySelector('.dot').classList.toggle('is-connected', Boolean(inp.connected));
        }
      );
    }

    renderOrderLists(prefs) {
      this._buildOrderList(this.els.listSectionOrder, prefs.sectionOrder, 'sec_', 'up', 'down', this.callbacks.onMoveSection);
      this._buildOrderList(this.els.listGroupOrder, prefs.groupOrder, 'grp_', 'left', 'right', this.callbacks.onMoveGroup);
    }

    focusMovedOrderButton(type, key, dir) {
      const box = type === 'section' ? this.els.listSectionOrder : this.els.listGroupOrder;
      const btn = box.querySelector(`.order-btn[data-key="${key}"][data-dir="${dir}"]`);
      this.focusElement(btn && !btn.disabled ? btn : box.querySelector(`.order-btn[data-key="${key}"]:not(:disabled)`));
    }

    openConfigDrawer(prefs) {
      if (this.configOpen) return this.closeConfigDrawer(true);
      this.closeGroupDrawer(false);
      this.configOpen = true;
      this.els.configDrawer.classList.remove('hidden');
      this.els.btnConfig.classList.add('is-active');
      this.renderOrderLists(prefs);
      this.focusElement(prefs.lang === 'de' ? this.els.btnLangDe : this.els.btnLangEn);
    }

    closeConfigDrawer(restoreFocus) {
      if (!this.configOpen) return;
      this.configOpen = false;
      this.els.configDrawer.classList.add('hidden');
      this.els.btnConfig.classList.remove('is-active');
      if (restoreFocus) this.focusElement(this.els.btnConfig);
    }

    openGroupDrawer(groupKey, tvState) {
      const cfg = GROUPS[groupKey];
      if (!cfg) return;
      if (this.openGroup === groupKey) return this.closeGroupDrawer(true);

      this.closeConfigDrawer(false);
      this.els.drawerTitle.textContent = global.SettingsMap.t(cfg.titleKey, this.lang);
      this._setOpenGroup(groupKey, tvState);

      const grid = this.els[cfg.gridEl];
      this.focusElement(grid.querySelector('.pill-btn.is-active') || grid.querySelector('.pill-btn'));
    }

    closeGroupDrawer(restoreFocus) {
      const prev = this.openGroup;
      this._setOpenGroup(null, null);
      if (restoreFocus && prev && GROUPS[prev]) this.focusElement(this.els[GROUPS[prev].btnEl]);
    }

    _setOpenGroup(groupKey, tvState) {
      this.openGroup = groupKey;
      this.els.groupDrawer.classList.toggle('hidden', !groupKey);
      this.els.soundOutWrap.classList.toggle('hidden', !(groupKey === 'sound' && tvState && tvState.soundOutput));
      Object.keys(GROUPS).forEach((k) => {
        this.els[GROUPS[k].gridEl].classList.toggle('hidden', k !== groupKey);
        this.els[GROUPS[k].btnEl].classList.toggle('is-open', k === groupKey);
      });
    }

    _applyDomOrder(container, order, map) {
      order.forEach((key) => { if (map[key]) container.appendChild(map[key]); });
    }

    _renderModeGroup(groupKey, tvState) {
      const cfg = GROUPS[groupKey];
      const activeKey = tvState[cfg.val];
      const base = tvState[cfg.list];
      const items = activeKey && base.indexOf(activeKey) === -1 ? [activeKey].concat(base) : base;
      const labels = global.SettingsMap[cfg.labels];
      const onSelect = this.callbacks[cfg.cb] || (() => {});

      this.els[cfg.valEl].textContent = global.SettingsMap.getLabel(labels, activeKey, this.lang);
      this._syncButtonGrid(this.els[cfg.gridEl], items, (btn, key) => btn.dataset.value === key,
        (key) => this._btn('pill-btn focusable', { value: key }, () => onSelect(key), [this._el('span', 'pill-label')]),
        (btn, key) => {
          btn.classList.toggle('is-active', key === activeKey);
          btn.querySelector('.pill-label').textContent = global.SettingsMap.getLabel(labels, key, this.lang);
        });
    }

    _syncButtonGrid(container, items, matches, create, update) {
      const existing = container.children;
      if (existing.length === items.length && items.every((item, idx) => matches(existing[idx], item))) {
        items.forEach((item, idx) => update(existing[idx], item));
        return;
      }
      const frag = document.createDocumentFragment();
      items.forEach((item) => { const n = create(item); update(n, item); frag.appendChild(n); });
      container.replaceChildren(frag);
    }

    _buildOrderList(container, order, labelPrefix, decIcon, incIcon, onMove) {
      const frag = document.createDocumentFragment();
      order.forEach((key, idx) => {
        const actions = this._el('div', 'order-actions');
        actions.append(
          this._orderBtn(decIcon, key, -1, idx === 0, onMove, idx),
          this._orderBtn(incIcon, key, 1, idx === order.length - 1, onMove, idx)
        );
        const itemBtn = this._btn('order-item focusable', { key: key }, () => {
          this.focusElement(actions.querySelector('.order-btn:not(:disabled)'));
        }, [this._el('span', 'order-label', global.SettingsMap.t(labelPrefix + key, this.lang))]);
        const row = this._el('div', 'order-row');
        row.append(itemBtn, actions);
        frag.appendChild(row);
      });
      container.replaceChildren(frag);
    }

    _orderBtn(iconDir, key, dir, disabled, onMove, idx) {
      const btn = this._btn('order-btn focusable', { key: key, dir: String(dir) }, () => onMove && onMove(idx, dir, key));
      btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="${ORDER_POINTS[iconDir]}"></polyline></svg>`;
      btn.disabled = disabled;
      return btn;
    }

    _el(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    _btn(className, dataset, onClick, children) {
      const btn = this._el('button', className);
      btn.type = 'button';
      if (dataset) Object.assign(btn.dataset, dataset);
      if (children) btn.append(...children);
      if (onClick) btn.addEventListener('click', onClick);
      return btn;
    }
  }

  G5Quick.OverlayView = OverlayView;
})(window);
