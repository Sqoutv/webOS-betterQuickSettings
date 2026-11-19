/**
 * Elevated Luna Service Bridge Proxy for Better Quick Settings (LG webOS).
 * Forwards whitelisted private-bus calls to com.webos.settingsservice and
 * com.webos.service.eim on behalf of the WebAppMgr overlay frontend.
 */
'use strict';

var Service = require('webos-service');
var service = new Service('com.mscha.betterquicksettings.service');

var ALLOWED_SETTINGS_METHODS = {
  getSystemSettings: true,
  setSystemSettings: true,
  getSystemSettingValues: true
};

service.register('ping', function (message) {
  var uid = typeof process.getuid === 'function' ? process.getuid() : -1;
  message.respond({
    returnValue: true,
    uid: uid
  });
  // If spawned un-elevated right after .ipk install, exit after responding so
  // ls-hubd respawns the service as root once elevate-service has run.
  if (uid !== 0 && uid !== -1) {
    setTimeout(function () {
      process.exit(0);
    }, 50);
  }
});

service.register('settings', function (message) {
  var payload = message.payload || {};
  var method = payload.method;
  var params = payload.params || {};

  if (!ALLOWED_SETTINGS_METHODS[method]) {
    message.respond({
      returnValue: false,
      errorText: 'Method not allowed: ' + String(method)
    });
    return;
  }

  service.call('luna://com.webos.settingsservice/' + method, params, function (res) {
    if (res && res.payload) {
      message.respond(res.payload);
    } else {
      message.respond({
        returnValue: false,
        errorText: 'Empty response from com.webos.settingsservice'
      });
    }
  });
});

service.register('eim', function (message) {
  service.call('luna://com.webos.service.eim/getAllInputStatus', {}, function (res) {
    if (res && res.payload) {
      message.respond(res.payload);
    } else {
      message.respond({
        returnValue: false,
        errorText: 'Empty response from com.webos.service.eim'
      });
    }
  });
});
