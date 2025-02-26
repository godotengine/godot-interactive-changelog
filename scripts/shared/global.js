(function () {
  'use strict';

  const LOCAL_PREFERENCE_PREFIX = "_godot_icl";
  const LOCAL_PREFERENCE_DEFAULTS = {

  };

  // API Interaction
  const ReportsAPI = {
    async get(path = '/') {
      const res = await fetch(`${path}`);
      if (res.status !== 200) {
        return null;
      }

      return await res.json();
    },

    async getVersionList(repositoryId) {
      const idBits = repositoryId.split("/");

      return await this.get(`data/${idBits[0]}.${idBits[1]}.versions.json`);
    },

    async getVersionData(repositoryId, versionName) {
      const idBits = repositoryId.split("/");

      return await this.get(`data/${idBits[0]}.${idBits[1]}.${versionName}.json`);
    },
  };

  // Content helpers
  const ReportsFormatter = {
    formatDate(dateString) {
      const options = {
        year: 'numeric', month: 'long', day: 'numeric',
      };
      const dateFormatter = new Intl.DateTimeFormat('en-US', options);

      const date = new Date(dateString);
      return dateFormatter.format(date);
    },

    formatTimestamp(timeString) {
      const options = {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', hour12: false, minute: 'numeric',
        timeZone: 'UTC', timeZoneName: 'short',
      };
      const dateFormatter = new Intl.DateTimeFormat('en-US', options);

      const date = new Date(timeString);
      return dateFormatter.format(date);
    },

    formatTimespan(timeValue, timeUnit) {
      const options = {
        style: 'long',
      };
      const timeFormatter = new Intl.RelativeTimeFormat('en-US', options);

      return timeFormatter.format(timeValue, timeUnit);
    },

    getDaysSince(dateString) {
      const date = new Date(dateString);
      const msBetween = (new Date()) - date;
      const days = Math.floor(msBetween / (1000 * 60 * 60 * 24));

      return days;
    },

    formatDays(days) {
      return days + " " + (days !== 1 ? "days" : "day");
    },
  };

  const ReportsUtils = {
    createEvent(name, detail = {}) {
      return  new CustomEvent(name, {
        detail: detail
      });
    },

    getHistoryHash() {
      let rawHash = window.location.hash;
      if (rawHash !== "") {
        return rawHash.substr(1);
      }

      return "";
    },

    setHistoryHash(hash) {
      const url = new URL(window.location);
      url.hash = hash;
      window.history.pushState({}, "", url);
    },

    navigateHistoryHash(hash) {
      this.setHistoryHash(hash);
      window.location.reload();
    },

    getLocalPreferences() {
      // Always fallback on defaults.
      const localPreferences = { ...LOCAL_PREFERENCE_DEFAULTS };

      for (let key in localPreferences) {
        const storedValue = localStorage.getItem(`${LOCAL_PREFERENCE_PREFIX}_${key}`);
        if (storedValue != null) {
          localPreferences[key] = JSON.parse(storedValue);
        }
      }

      return localPreferences;
    },

    setLocalPreferences(currentPreferences) {
      for (let key in currentPreferences) {
        // Only store known properties.
        if (key in LOCAL_PREFERENCE_DEFAULTS) {
          localStorage.setItem(`${LOCAL_PREFERENCE_PREFIX}_${key}`, JSON.stringify(currentPreferences[key]));
        }
      }
    },

    resetLocalPreferences() {
      this.setLocalPreferences(LOCAL_PREFERENCE_DEFAULTS);
    },
  };

  const ReportsSingleton = {
    api: ReportsAPI,
    format: ReportsFormatter,
    util: ReportsUtils,
  };

  window.greports = ReportsSingleton;

}());
