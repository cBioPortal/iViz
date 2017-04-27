'use strict';

(function(vcSession, _, $) {
  if (!_.isObject(vcSession)) {
    vcSession = {};
  }
  vcSession.model = (function() {
    var localStorageAdd_ = function(virtualCohort) {
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
        $.ajax({
          type: 'POST',
          url: vcSession.URL,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(virtualCohort)
        }).done(function(response) {
          if (virtualCohort.userID === 'DEFAULT') {
            virtualCohort.virtualCohortID = response.id;
            localStorageAdd_(virtualCohort);
          }
          def.resolve(response);
        }).fail(function() {
          virtualCohort.virtualCohortID = vcSession.utils.generateUUID();
          localStorageAdd_(virtualCohort);
          def.reject();
        });
        return def.promise();
      },
      saveSessionWithoutWritingLocalStorage: function(_virtualCohort, _callbackFunc) {
        $.ajax({
          type: 'POST',
          url: vcSession.URL,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(_virtualCohort)
        }).done(function(response) {
          if (_virtualCohort.userID === 'DEFAULT') {
            _virtualCohort.virtualCohortID = response.id;
            _callbackFunc(response.id);
          }
        }).fail(function() {
          _virtualCohort.virtualCohortID = vcSession.utils.generateUUID();
          _callbackFunc(response.id);
        });
      },
      removeSession: function(_virtualCohort) {
        // Delete cohort just from browser localstorage
       /* $.ajax({
          type: 'DELETE',
          url: vcSession.URL + '/' + _virtualCohort.virtualCohortID,
          contentType: 'application/json;charset=UTF-8'
        }).done(function() {
          if (_virtualCohort.userID === 'DEFAULT') {
            localStorageDelete_(_virtualCohort);
          }
        }).fail(function() {
          localStorageDelete_(_virtualCohort);
        });*/
        localStorageDelete_(_virtualCohort);
      },
      editSession: function(_virtualCohort) {
        $.ajax({
          type: 'PUT',
          url: vcSession.URL + '/' + _virtualCohort.virtualCohortID,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(_virtualCohort)
        }).done(function() {
          if (_virtualCohort.userID === 'DEFAULT') {
            localStorageEdit_(_virtualCohort);
          }
        }).fail(function(jqXHR) {
          // TODO: should we delete the virtual cohort if no record found
          // in the database? Should we add it into database?
          if (jqXHR.status === 404) {
            localStorageDelete_(_virtualCohort);
            vcSession.model.saveSession(_virtualCohort);
          } else {
            localStorageEdit_(_virtualCohort);
          }
        });
      },
      /*
      This method would be used in cbio to get user specific cohorts
       // TODO: should we send request without validating userID?
       */
      loadUserVirtualCohorts: function() {
        var def = new $.Deferred();
        $.ajax({
          type: 'GET',
          url: vcSession.URL + '/get-user-cohorts',
          contentType: 'application/json;charset=UTF-8'
        }).done(function(response) {
          var _virtualCohorts = [];
          $.each(response, function(key, val) {
            var _virtualCohort = val.data;
            _virtualCohort.virtualCohortID = val.id;
            _virtualCohorts.push(_virtualCohort);
          });
          def.resolve(_virtualCohorts);
        }).fail(function() {
          def.resolve([]);
        });
        return def.promise();
      }
    };
  })();
})(window.vcSession,
  window._,
  window.$ || window.jQuery);
