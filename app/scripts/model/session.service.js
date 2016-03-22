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
    var localStorageAdd = function(id, virtualCohort) {
      virtualCohort.virtualCohortID = id;
      var virtualCohorts = iViz.session.utils.getVirtualCohorts();
      virtualCohorts.push(virtualCohort);
      iViz.session.utils.setVirtualCohorts(virtualCohorts);
    };

    var localStorageDelete = function(virtualCohort) {
      var virtualCohorts = iViz.session.utils.getVirtualCohorts();
      virtualCohorts = _.without(virtualCohorts, _.findWhere(virtualCohorts,
        {virtualCohortID: virtualCohort.virtualCohortID}));
      iViz.session.utils.setVirtualCohorts(virtualCohorts);
    };

    var localStorageEdit = function(updateVirtualCohort) {
      var virtualCohorts = iViz.session.utils.getVirtualCohorts();
      _.extend(_.findWhere(virtualCohorts, {
        virtualCohortID: updateVirtualCohort.virtualCohortID
      }), updateVirtualCohort);
      iViz.session.utils.setVirtualCohorts(virtualCohorts);
    };

    return {
      saveSession: function(virtualCohort) {
        var data = {
          virtualCohort: virtualCohort
        };
        $.ajax({
          type: 'POST',
          url: url,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(data)
        }).done(function(response) {
          localStorageAdd(response.id,
            response.data.virtualCohort);
        }).fail(function() {
          localStorageAdd(iViz.session.utils.generateUUID(),
            data.virtualCohort);
        });
      },
      removeSession: function(_virtualCohort) {
        $.ajax({
          type: 'DELETE',
          url: url + _virtualCohort.virtualCohortID,
          contentType: 'application/json;charset=UTF-8'
        }).done(function() {
          localStorageDelete(_virtualCohort);
        }).fail(function() {
          localStorageDelete(_virtualCohort);
        });
      },
      editSession: function(_virtualCohort) {
        var data = {
          virtualCohort: _virtualCohort
        };
        $.ajax({
          type: 'PUT',
          url: url + _virtualCohort.virtualCohortID,
          contentType: 'application/json;charset=UTF-8',
          data: JSON.stringify(data)
        }).done(function(response) {
          localStorageEdit(response.data.virtualCohort);
        }).fail(function() {
          localStorageEdit(_virtualCohort);
        });
      },
      loadUserVirtualCohorts: function(userID) {
        $.ajax({
          type: 'GET',
          url: url + 'query/',
          contentType: 'application/json;charset=UTF-8',
          data: {userid: userID}
        }).done(function(response) {
          var virtualCohorts = [];
          $.each(response, function(key, val) {
            var virtualCohort = val.data.virtualCohort;
            virtualCohort.virtualCohortID = val.id;
            virtualCohorts.push(virtualCohort);
          });
          iViz.session.utils.setVirtualCohorts(virtualCohorts);
        }).fail(function() {
          console.log('unable to get user virtual cohorts');
        });
      },

      getVirtualCohortDetails: function(virtualCohortID) {
        $.ajax({
          type: 'GET',
          url: url + virtualCohortID,
          contentType: 'application/json;charset=UTF-8'
        }).done(function(response) {
          var toReturn = _.omit(response.data.virtualCohort,
            ['created', 'userID', 'virtualCohortID']);
          return toReturn;
        }).fail(function() {
          return null;
        });
      }
    };
  })();
})(window.iViz,
  window._,
  window.$ || window.jQuery);
