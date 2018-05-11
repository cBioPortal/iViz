'use strict';
// Move vcSession initialization to here since the sessionEvent.js
// is the first one to be called in the dependency list.
window.vcSession = window.vcSession ? window.vcSession : {};

(function(vcSession, _) {
  if (!_.isObject(vcSession)) {
    vcSession = {};
  }
  vcSession.events = (function() {
    return {
      saveCohort: function(stats, name, description, addToUserStudies) {
        var def = new $.Deferred();
        $.when(vcSession.utils.buildVCObject(stats,
          name, description)).done(function(_virtualCohort) {
          vcSession.model.saveSession(_virtualCohort, addToUserStudies)
            .done(function(response) {
              def.resolve(response);
            })
            .fail(function() {
              def.reject();
            });
        });
        return def.promise();
      }
    };
  })();
})(window.vcSession,
  window._);
