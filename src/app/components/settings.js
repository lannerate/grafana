define([
  'lodash',
  'crypto',
],
function (_, crypto) {
  "use strict";

  return function Settings (options) {
    /**
     * To add a setting, you MUST define a default. Also,
     * THESE ARE ONLY DEFAULTS.
     * They are overridden by config.js in the root directory
     * @type {Object}
     */
    var defaults = {
      datasources                   : {},
      window_title_prefix           : 'Grafana - ',
      panels                        : {
        'graph':      { path: 'panels/graph',      name: 'Graph' },
        'singlestat': { path: 'panels/singlestat', name: 'Single stat' },
        'text':       { path: 'panels/text',       name: 'Text' },
        'dashlist':   { path: 'panels/dashlist',   name: 'Dashboard list' },
      },
      new_panel_title: 'no title (click here)',
      plugins: {},
      default_route: '/dashboard/file/default.json',
      playlist_timespan: "1m",
      unsaved_changes_warning: true,
      search: { max_results: 100 },
      admin: {},
      appSubUrl: ""
    };

    var settings = _.extend({}, defaults, options);

    var parseBasicAuth = function(datasource) {
      var passwordEnd = datasource.url.indexOf('@');
      if (passwordEnd > 0) {
        var userStart = datasource.url.indexOf('//') + 2;
        var userAndPassword = datasource.url.substring(userStart, passwordEnd);
        var bytes = crypto.charenc.Binary.stringToBytes(userAndPassword);
        datasource.basicAuth = crypto.util.bytesToBase64(bytes);

        var urlHead = datasource.url.substring(0, userStart);
        datasource.url = urlHead + datasource.url.substring(passwordEnd + 1);
      }

      return datasource;
    };

    var parseMultipleHosts = function(datasource) {
      datasource.urls = _.map(datasource.url.split(","), function (url) { return url.trim(); });
      return datasource;
    };

    // backward compatible with old config
    if (options.graphiteUrl) {
      settings.datasources.graphite = {
        type: 'graphite',
        url: options.graphiteUrl,
        default: true
      };
    }

    if (options.elasticsearch) {
      settings.datasources.elasticsearch = {
        type: 'elasticsearch',
        url: options.elasticsearch,
        index: options.grafana_index,
        grafanaDB: true
      };
    }

    _.each(settings.datasources, function(datasource, key) {
      datasource.name = key;
      if (datasource.url) { parseBasicAuth(datasource); }
      if (datasource.type === 'influxdb') { parseMultipleHosts(datasource); }
    });

    if (settings.plugins.panels) {
      _.extend(settings.panels, settings.plugins.panels);
    }

    if (!settings.plugins.dependencies) {
      settings.plugins.dependencies = [];
    }

    return settings;
  };
});
