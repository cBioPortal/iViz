/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an 'as is' basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * Created by Karthik Kalletla on 3/21/16.
 */

'use strict';
(function(iViz, _, $) {
  iViz.session.model = (function() {
    var localStorageAdd_ = function(id, virtualCohort) {
      virtualCohort.virtualCohortID = id;
      var _virtualCohorts = iViz.session.utils.getVirtualCohorts();
      _virtualCohorts.push(virtualCohort);
      iViz.session.utils.setVirtualCohorts(_virtualCohorts);
    };

    var localStorageDelete_ = function(virtualCohort) {
      var _virtualCohorts = iViz.session.utils.getVirtualCohorts();
      _virtualCohorts = _.without(_virtualCohorts, _.findWhere(_virtualCohorts,
        {virtualCohortID: virtualCohort.virtualCohortID}));
      iViz.session.utils.setVirtualCohorts(_virtualCohorts);
    };

    var localStorageEdit_ = function(updateVirtualCohort) {
      var _virtualCohorts = iViz.session.utils.getVirtualCohorts();
      _.extend(_.findWhere(_virtualCohorts, {
        virtualCohortID: updateVirtualCohort.virtualCohortID
      }), updateVirtualCohort);
      iViz.session.utils.setVirtualCohorts(_virtualCohorts);
    };

    return {
      saveSession: function(virtualCohort) {
        var data = {
          virtualCohort: virtualCohort
        };
        $.ajax({
          type: 'POST',
          url: URL,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(data)
        }).done(function(response) {
          localStorageAdd_(response.id,
            response.data.virtualCohort);
        }).fail(function() {
          localStorageAdd_(iViz.session.utils.generateUUID(),
            data.virtualCohort);
        });
      },
      removeSession: function(_virtualCohort) {
        $.ajax({
          type: 'DELETE',
          url: URL + _virtualCohort.virtualCohortID,
          contentType: 'application/json;charset=UTF-8'
        }).done(function() {
          localStorageDelete_(_virtualCohort);
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
          url: URL + _virtualCohort.virtualCohortID,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(data)
        }).done(function(response) {
          localStorageEdit_(response.data.virtualCohort);
        }).fail(function(jqXHR) {
          if (jqXHR.status === 404) {
            localStorageDelete_(_virtualCohort);
            iViz.session.model.saveSession(_virtualCohort);
          } else {
            localStorageEdit_(_virtualCohort);
          }
        });
      },
      loadUserVirtualCohorts: function(userID) {
        $.ajax({
          type: 'GET',
          url: URL + 'query/',
          contentType: 'application/json;charset=UTF-8',
          data: {userid: userID}
        }).done(function(response) {
          var _virtualCohorts = [];
          $.each(response, function(key, val) {
            var _virtualCohort = val.data.virtualCohort;
            _virtualCohort.virtualCohortID = val.id;
            _virtualCohorts.push(_virtualCohort);
          });
          iViz.session.utils.setVirtualCohorts(_virtualCohorts);
        }).fail(function() {
          console.log('unable to get user virtual cohorts');
        });
      },

      getVirtualCohortDetails: function(virtualCohortID) {
        $.getJSON(URL + virtualCohortID, function(response) {
          iViz.applyVC(_.omit(response.data.virtualCohort,
            ['created', 'userID', 'virtualCohortID']));
          jQuery.notify('Imported Virtual Cohort', 'success');
        }).fail(function() {
          var virtualCohort_ = _.findWhere(iViz.session.utils.getVirtualCohorts(), {
            virtualCohortID: virtualCohortID
          });
          if (virtualCohort_ !== undefined) {
            iViz.applyVC(_.omit(virtualCohort_,
              ['created', 'userID', 'virtualCohortID']));
            jQuery.notify('Imported Virtual Cohort', 'success');
          } else {
            jQuery.notify('Error While importing Virtual Cohort', 'error');
          }
        });
      }
    };
  })();
})(window.iViz,
  window._,
  window.$ || window.jQuery);
