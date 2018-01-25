'use strict';

(function(vcSession, _, $) {
  if (!_.isObject(vcSession)) {
    vcSession = {};
  }
  vcSession.model = (function() {

    return {
      saveSession: function(virtualCohort, addToUserStudies) {
        var def = new $.Deferred();
        var url = addToUserStudies ? vcSession.URL+"/save" : vcSession.URL;
        $.ajax({
          type: 'POST',
          url: url,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(virtualCohort)
        }).done(function(response) {
          if (virtualCohort.userID === 'DEFAULT') {
            virtualCohort.virtualCohortID = response.id;
          }
          def.resolve(response);
        }).fail(function() {
          def.reject();
        });
        return def.promise();
      }
    };
  })();
})(window.vcSession,
  window._,
  window.$ || window.jQuery);
