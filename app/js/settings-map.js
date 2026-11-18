/**
 * Bilingual localization dictionary (English / German) for UI strings and webOS setting keys.
 * Defaults to English ('en') and supports dynamic signal variants (SDR / HDR10 / Dolby Vision)
 * returned by com.webos.settingsservice/getSystemSettingValues.
 */
(function (global) {
  'use strict';

  var UI_STRINGS = {
    en: {
      panelAria: 'Quick Settings',
      hdmiTitle: 'HDMI Input',
      hdmiSelect: 'Select',
      brightnessTitle: 'OLED Brightness',
      pictureTitle: 'Picture Mode',
      soundTitle: 'Sound Mode',
      energyTitle: 'Energy Saving',
      audioOut: 'Audio Output',
      lgSettingsBtn: 'LG',
      lgSettingsTitle: 'Open LG Standard Settings',
      configBtnTitle: 'Customize Quicksettings',
      dimBtnTitle: 'UI Brightness (Paper White)',
      refreshBtnTitle: 'Reload Values',
      closeBtnTitle: 'Close (Back)',
      configTitle: 'Customize Quicksettings',
      langTitle: 'Language',
      stepTitle: 'Brightness Step',
      secOrderTitle: 'Section Order',
      grpOrderTitle: 'Group Tile Order',
      sec_hdmi: 'HDMI Input',
      sec_brightness: 'OLED Brightness',
      sec_groups: 'Mode Tiles',
      grp_picture: 'Picture Mode',
      grp_sound: 'Sound Mode',
      grp_energy: 'Energy Saving'
    },
    de: {
      panelAria: 'Schnelleinstellungen',
      hdmiTitle: 'HDMI-Eingang',
      hdmiSelect: 'Auswählen',
      brightnessTitle: 'OLED-Helligkeit',
      pictureTitle: 'Bildmodus',
      soundTitle: 'Tonmodus',
      energyTitle: 'Energie',
      audioOut: 'Audio-Ausgabe',
      lgSettingsBtn: 'LG',
      lgSettingsTitle: 'LG Standard-Einstellungen öffnen',
      configBtnTitle: 'Quicksettings anpassen',
      dimBtnTitle: 'UI-Helligkeit (Paper White)',
      refreshBtnTitle: 'Werte neu laden',
      closeBtnTitle: 'Schließen (Zurück)',
      configTitle: 'Quicksettings anpassen',
      langTitle: 'Sprache',
      stepTitle: 'Helligkeits-Schritte',
      secOrderTitle: 'Reihenfolge Bereiche',
      grpOrderTitle: 'Reihenfolge Gruppen',
      sec_hdmi: 'HDMI-Eingang',
      sec_brightness: 'OLED-Helligkeit',
      sec_groups: 'Modus-Kacheln',
      grp_picture: 'Bildmodus',
      grp_sound: 'Tonmodus',
      grp_energy: 'Energie'
    }
  };

  var PICTURE_MODE_LABELS = {
    personalized: { en: 'Personalized', de: 'Personalisiert' },
    filmMaker: { en: 'Filmmaker', de: 'Filmmaker' },
    cinema: { en: 'Cinema', de: 'Kino' },
    cinemaHome: { en: 'Cinema Home', de: 'Kino Home' },
    expert1: { en: 'ISF Bright', de: 'ISF Hell' },
    expert2: { en: 'ISF Dark', de: 'ISF Dunkel' },
    game: { en: 'Game Optimizer', de: 'Spiel' },
    normal: { en: 'Standard', de: 'Standard' },
    eco: { en: 'Eco', de: 'Eco' },
    vivid: { en: 'Vivid', de: 'Lebhaft' },
    sports: { en: 'Sports', de: 'Sport' },
    photo: { en: 'Photo', de: 'Foto' },
    // HDR10 / HLG / Dolby Vision variants on LG G5 (webOS 25)
    hdrPersonalized: { en: 'HDR Personalized', de: 'HDR Personal.' },
    hdrFilmMaker: { en: 'HDR Filmmaker', de: 'HDR Filmmaker' },
    hdrCinema: { en: 'HDR Cinema', de: 'HDR Kino' },
    hdrCinemaBright: { en: 'HDR Cinema Home', de: 'HDR Kino Home' },
    hdrCinemaHome: { en: 'HDR Cinema Home', de: 'HDR Kino Home' },
    hdrGame: { en: 'HDR Game', de: 'HDR Spiel' },
    hdrStandard: { en: 'HDR Standard', de: 'HDR Standard' },
    hdrVivid: { en: 'HDR Vivid', de: 'HDR Lebhaft' },
    hdrEco: { en: 'HDR Eco', de: 'HDR Eco' },
    dolbyHdrPersonalized: { en: 'DV Personalized', de: 'DV Personal.' },
    dolbyHdrCinema: { en: 'DV Cinema', de: 'DV Kino' },
    dolbyHdrDark: { en: 'DV Cinema Dark', de: 'DV Kino (Dunkel)' },
    dolbyHdrCinemaBright: { en: 'DV Cinema Home', de: 'DV Kino Home' },
    dolbyHdrCinemaHome: { en: 'DV Cinema Home', de: 'DV Kino Home' },
    dolbyHdrGame: { en: 'DV Game', de: 'DV Spiel' },
    dolbyHdrStandard: { en: 'DV Standard', de: 'DV Standard' },
    dolbyHdrVivid: { en: 'DV Vivid', de: 'DV Lebhaft' }
  };

  var ENERGY_SAVING_LABELS = {
    off: { en: 'Off', de: 'Aus' },
    min: { en: 'Minimum', de: 'Minimum' },
    med: { en: 'Medium', de: 'Mittel' },
    max: { en: 'Maximum', de: 'Maximum' },
    auto: { en: 'Auto', de: 'Auto' },
    screen_off: { en: 'Screen Off', de: 'Bildschirm aus' }
  };

  var SOUND_MODE_LABELS = {
    aiSoundPlus: { en: 'AI Sound Pro', de: 'AI Sound Pro' },
    aiSound: { en: 'AI Sound', de: 'AI Sound' },
    standard: { en: 'Standard', de: 'Standard' },
    cinema: { en: 'Cinema', de: 'Kino' },
    clearVoicePro: { en: 'Clear Voice Pro', de: 'Klare Stimme' },
    clearVoice: { en: 'Clear Voice', de: 'Klare Stimme' },
    sports: { en: 'Sports', de: 'Sport' },
    music: { en: 'Music', de: 'Musik' },
    game: { en: 'Game Optimizer', de: 'Spiel' }
  };

  var SOUND_OUT_LABELS = {
    tv_speaker: { en: 'TV Speaker', de: 'TV-Lautsprecher' },
    external_arc: { en: 'HDMI (e)ARC', de: 'HDMI (e)ARC' },
    external_optical: { en: 'Optical', de: 'Optisch' },
    bt_soundbar: { en: 'Bluetooth', de: 'Bluetooth' },
    lineout: { en: 'Line Out', de: 'Line Out' },
    headphone: { en: 'Headphones', de: 'Kopfhörer' },
    tv_external_speaker: { en: 'TV + Optical', de: 'TV + Optisch' },
    tv_speaker_bluetooth: { en: 'TV + Bluetooth', de: 'TV + Bluetooth' },
    wisa_speaker: { en: 'WiSA', de: 'WiSA' }
  };

  var FALLBACK_PICTURE_MODES = ['filmMaker', 'cinema', 'cinemaHome', 'expert2', 'game', 'normal'];
  var FALLBACK_ENERGY_MODES = ['off', 'min', 'med', 'max', 'auto', 'screen_off'];
  var FALLBACK_SOUND_MODES = ['aiSoundPlus', 'cinema', 'standard', 'clearVoicePro', 'game', 'music'];

  function normalizeLang(lang) {
    return lang === 'de' ? 'de' : 'en';
  }

  function formatFallbackLabel(key) {
    if (!key) return '--';
    return String(key)
      .replace(/^dolbyHdr/, 'DV ')
      .replace(/^hdr/, 'HDR ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ');
  }

  function t(key, lang) {
    var l = normalizeLang(lang);
    var dict = UI_STRINGS[l] || UI_STRINGS.en;
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    if (Object.prototype.hasOwnProperty.call(UI_STRINGS.en, key)) return UI_STRINGS.en[key];
    return key;
  }

  function getLabel(map, key, lang) {
    if (!key) return '--';
    if (!Object.prototype.hasOwnProperty.call(map, key)) {
      return formatFallbackLabel(key);
    }
    var entry = map[key];
    if (typeof entry === 'string') return entry;
    var l = normalizeLang(lang);
    return entry[l] || entry.en || formatFallbackLabel(key);
  }

  global.SettingsMap = {
    UI_STRINGS: UI_STRINGS,
    PICTURE_MODE_LABELS: PICTURE_MODE_LABELS,
    ENERGY_SAVING_LABELS: ENERGY_SAVING_LABELS,
    SOUND_MODE_LABELS: SOUND_MODE_LABELS,
    SOUND_OUT_LABELS: SOUND_OUT_LABELS,
    FALLBACK_PICTURE_MODES: FALLBACK_PICTURE_MODES,
    FALLBACK_ENERGY_MODES: FALLBACK_ENERGY_MODES,
    FALLBACK_SOUND_MODES: FALLBACK_SOUND_MODES,
    t: t,
    getLabel: getLabel
  };
})(window);
