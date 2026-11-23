/**
 * Lightweight zero-dependency Luna Service Bus bridge for LG webOS (WebAppMgr).
 * Falls back to an interactive local mock when opened in a desktop browser.
 */
(function (global) {
  'use strict';

  var APP_ID = 'io.github.sqoutv.betterquicksettings';
  var SERVICE_ID = 'io.github.sqoutv.betterquicksettings.service';
  var BridgeCtor = global.WebOSServiceBridge || global.PalmServiceBridge || null;
  var isWebOS = Boolean(BridgeCtor);

  // Prevents premature Chromium garbage collection of in-flight WebOSServiceBridge instances
  var activeBridges = new Set();
  var isElevated = false;
  var elevationPromise = null;
  var ELEVATE_CMD =
    '/media/developer/apps/usr/palm/services/org.webosbrew.hbchannel.service/elevate-service ' +
    SERVICE_ID + ' && ls-control scan-services';

  // Simulated state used when running in a desktop browser outside webOS
  var mockState = {
    picture: {
      backlight: 65,
      pictureMode: 'filmMaker',
      energySaving: 'off'
    },
    sound: {
      soundMode: 'cinema',
      soundOutput: 'external_arc'
    },
    activeHdmi: 'HDMI_1',
    inputs: [
      { id: 'HDMI_1', appId: 'com.webos.app.hdmi1', label: 'Apple TV 4K', connected: true },
      { id: 'HDMI_2', appId: 'com.webos.app.hdmi2', label: 'PS5 (eARC)', connected: true },
      { id: 'HDMI_3', appId: 'com.webos.app.hdmi3', label: 'HDMI 3', connected: false },
      { id: 'HDMI_4', appId: 'com.webos.app.hdmi4', label: 'PC HDR', connected: true }
    ]
  };

  function handleMock(serviceUri, method, params) {
    if (serviceUri === 'luna://com.webos.settingsservice') {
      if (method === 'getSystemSettings') {
        var cat = params.category || 'picture';
        var source = mockState[cat] || {};
        var settings = {};
        var keys = Array.isArray(params.keys) ? params.keys : Object.keys(source);
        for (var i = 0; i < keys.length; i++) {
          if (Object.prototype.hasOwnProperty.call(source, keys[i])) {
            settings[keys[i]] = source[keys[i]];
          }
        }
        return { returnValue: true, category: cat, settings: settings };
      }

      if (method === 'setSystemSettings') {
        var setCat = params.category || 'picture';
        if (!mockState[setCat]) mockState[setCat] = {};
        var incoming = params.settings || {};
        var incKeys = Object.keys(incoming);
        for (var j = 0; j < incKeys.length; j++) {
          mockState[setCat][incKeys[j]] = incoming[incKeys[j]];
        }
        return { returnValue: true };
      }

      if (method === 'getSystemSettingValues') {
        var valuesMap = {
          pictureMode: [
            'filmMaker',
            'cinema',
            'cinemaHome',
            'expert1',
            'expert2',
            'game',
            'normal',
            'vivid'
          ],
          energySaving: ['off', 'min', 'med', 'max', 'auto', 'screen_off'],
          soundMode: ['aiSoundPlus', 'standard', 'cinema', 'clearVoicePro', 'sports', 'music', 'game']
        };
        return {
          returnValue: true,
          results: [{ values: valuesMap[params.key] || [] }]
        };
      }
    }

    if (serviceUri === 'luna://com.webos.service.eim' && method === 'getAllInputStatus') {
      return {
        returnValue: true,
        devices: mockState.inputs.map(function (dev) {
          return {
            id: dev.id,
            appId: dev.appId,
            label: dev.label,
            connected: dev.connected,
            favorite: false
          };
        })
      };
    }

    if (serviceUri === 'luna://com.webos.applicationManager') {
      if (method === 'launch' && params.id) {
        var found = mockState.inputs.filter(function (d) { return d.appId === params.id; })[0];
        if (found) mockState.activeHdmi = found.id;
        return { returnValue: true };
      }
      if (method === 'getForegroundAppInfo') {
        var active = mockState.inputs.filter(function (d) { return d.id === mockState.activeHdmi; })[0];
        return { returnValue: true, appId: active ? active.appId : 'com.webos.app.hdmi1' };
      }
      if (method === 'closeByAppId') {
        return { returnValue: true };
      }
    }

    return { returnValue: false, errorText: 'Mock: Unknown method ' + serviceUri + '/' + method };
  }

  function rawCall(targetUri, payload, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var bridge = new BridgeCtor();
      activeBridges.add(bridge);

      var settled = false;
      var timer = setTimeout(function () {
        if (!settled) {
          settled = true;
          activeBridges.delete(bridge);
          reject({ errorText: 'Timeout: ' + targetUri });
        }
      }, timeoutMs || 3000);

      bridge.onservicecallback = function (raw) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        activeBridges.delete(bridge);

        try {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.returnValue === false) {
            reject(parsed);
          } else {
            resolve(parsed);
          }
        } catch (err) {
          reject({ errorText: 'Invalid JSON response' });
        }
      };

      try {
        bridge.call(targetUri, JSON.stringify(payload || {}));
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          activeBridges.delete(bridge);
          reject({ errorText: err.message || 'Bridge call failed' });
        }
      }
    });
  }

  function ensureElevated() {
    if (!isWebOS || isElevated) {
      return Promise.resolve();
    }
    if (elevationPromise) {
      return elevationPromise;
    }

    elevationPromise = rawCall('luna://' + SERVICE_ID + '/ping', {}, 2500)
      .catch(function () { return null; })
      .then(function (res) {
        if (res && res.returnValue && res.uid === 0) {
          isElevated = true;
          return;
        }
        // Self-elevate once after standalone .ipk installs (Dev Manager / Homebrew Channel)
        return rawCall('luna://org.webosbrew.hbchannel.service/exec', { command: ELEVATE_CMD }, 8000)
          .then(function () {
            return new Promise(function (resolve) {
              setTimeout(function () {
                isElevated = true;
                resolve();
              }, 450);
            });
          });
      })
      .catch(function (err) {
        elevationPromise = null;
        throw err;
      });

    return elevationPromise;
  }

  function call(serviceUri, method, params) {
    var payload = params || {};

    if (!isWebOS) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var res = handleMock(serviceUri, method, payload);
          if (res && res.returnValue !== false) {
            resolve(res);
          } else {
            reject(res || { errorText: 'Mock error' });
          }
        }, 12);
      });
    }

    var normalized = serviceUri.replace(/\/$/, '');
    var targetUri = normalized + '/' + method;
    var targetPayload = payload;
    var needsService = false;

    // WebAppMgr bridge calls run on the public Luna bus and get rejected by com.webos.settingsservice
    // and com.webos.service.eim on webOS 25 -> proxy those calls through our elevated root service.
    if (normalized === 'luna://com.webos.settingsservice') {
      targetUri = 'luna://' + SERVICE_ID + '/settings';
      targetPayload = { method: method, params: payload };
      needsService = true;
    } else if (normalized === 'luna://com.webos.service.eim' && method === 'getAllInputStatus') {
      targetUri = 'luna://' + SERVICE_ID + '/eim';
      targetPayload = {};
      needsService = true;
    }

    if (!needsService) {
      return rawCall(targetUri, targetPayload, 3000);
    }

    return ensureElevated().then(function () {
      return rawCall(targetUri, targetPayload, 3000);
    });
  }

  /**
   * Hides the overlay instead of closing it so WebAppMgr keeps the process warm
   * in memory (keepAlive: true) for instant <0.3s relaunches.
   */
  function hideSelf() {
    if (!isWebOS) return;

    var sys = global.webOSSystem || global.PalmSystem;
    if (sys && typeof sys.hide === 'function') {
      sys.hide();
      return;
    }
    if (sys && typeof sys.platformBack === 'function') {
      sys.platformBack();
      return;
    }

    closeSelf();
  }

  function activateSelf() {
    if (!isWebOS) return;
    var sys = global.webOSSystem || global.PalmSystem;
    if (sys && typeof sys.activate === 'function') {
      sys.activate();
    }
  }

  function closeSelf() {
    if (!isWebOS) return;

    call('luna://com.webos.applicationManager', 'closeByAppId', { id: APP_ID })
      .catch(function () {
        return call('luna://com.webos.service.applicationmanager', 'close', { id: APP_ID });
      })
      .catch(function () {
        if (global.webOSSystem && typeof global.webOSSystem.close === 'function') {
          global.webOSSystem.close();
        } else {
          global.close();
        }
      });
  }

  global.Luna = {
    APP_ID: APP_ID,
    isWebOS: isWebOS,
    call: call,
    hideSelf: hideSelf,
    activateSelf: activateSelf,
    closeSelf: closeSelf
  };
})(window);
