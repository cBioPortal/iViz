'use strict';
window.vcSession = window.vcSession ? window.vcSession : {};

(function(vcSession, _, $) {
  if (!_.isObject(vcSession)) {
    vcSession = {};
  }
  vcSession.model = (function() {
    var localStorageAdd_ = function(id, virtualCohort) {
      virtualCohort.virtualCohortID = id;
      var _virtualCohorts = vcSession.utils.getVirtualCohorts();
      _virtualCohorts.push(virtualCohort);
      vcSession.utils.setVirtualCohorts(_virtualCohorts);
    };

    var localStorageDelete_ = function(virtualCohort) {
      var _virtualCohorts = vcSession.utils.getVirtualCohorts();
      _virtualCohorts = _.without(_virtualCohorts, _.findWhere(_virtualCohorts,
        {virtualCohortID: virtualCohort.virtualCohortID}));
      vcSession.utils.setVirtualCohorts(_virtualCohorts);
    };

    var localStorageEdit_ = function(updateVirtualCohort) {
      var _virtualCohorts = vcSession.utils.getVirtualCohorts();
      _.extend(_.findWhere(_virtualCohorts, {
        virtualCohortID: updateVirtualCohort.virtualCohortID
      }), updateVirtualCohort);
      vcSession.utils.setVirtualCohorts(_virtualCohorts);
    };

    return {
      saveSession: function(virtualCohort) {
        var def = new $.Deferred();
        var data = {
          virtualCohort: virtualCohort
        };
        $.ajax({
          type: 'POST',
          url: vcSession.URL,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(data)
        }).done(function(response) {
          if (virtualCohort.userID === 'DEFAULT') {
            localStorageAdd_(response.id,
              virtualCohort);
          }
          def.resolve();
        }).fail(function() {
          localStorageAdd_(vcSession.utils.generateUUID(),
            virtualCohort);
          def.reject();
        });
        return def.promise();
      },
      removeSession: function(_virtualCohort) {
        $.ajax({
          type: 'DELETE',
          url: vcSession.URL + _virtualCohort.virtualCohortID,
          contentType: 'application/json;charset=UTF-8'
        }).done(function() {
          if (_virtualCohort.userID === 'DEFAULT') {
            localStorageDelete_(_virtualCohort);
          }
        }).fail(function() {
          localStorageDelete_(_virtualCohort);
        });
      },
      editSession: function(_virtualCohort) {
        var data = {
          virtualCohort: _virtualCohort
        };
        $.ajax({
          type: 'PUT',
          url: vcSession.URL + _virtualCohort.virtualCohortID,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(data)
        }).done(function(response) {
          if (_virtualCohort.userID === 'DEFAULT') {
            localStorageEdit_(data.virtualCohort);
          }
        }).fail(function(jqXHR) {
          if (jqXHR.status === 404) {
            localStorageDelete_(_virtualCohort);
            vcSession.model.saveSession(_virtualCohort);
          } else {
            localStorageEdit_(_virtualCohort);
          }
        });
      },
      loadUserVirtualCohorts: function(userID) {
        var def = new $.Deferred();
        $.ajax({
          type: 'GET',
          url: vcSession.URL + 'query/',
          contentType: 'application/json;charset=UTF-8',
          data: {
            field: 'data.virtualCohort.userID',
            value: userID
          }
        }).done(function(response) {
          var _virtualCohorts = [];
          $.each(response, function(key, val) {
            var _virtualCohort = val.data.virtualCohort;
            _virtualCohort.virtualCohortID = val.id;
            _virtualCohorts.push(_virtualCohort);
          });
          def.resolve(_virtualCohorts);
          //vcSession.utils.setVirtualCohorts(_virtualCohorts);
        }).fail(function() {
          console.log('unable to get user virtual cohorts');
          def.reject();
        });
        return def.promise();
      }
    };
  })();
})(window.vcSession,
  window._,
  window.$ || window.jQuery);
