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
iViz.session.utils = (function() {

  var virtualCohort = {
    studyName: 'My virtual study',
    description: 'My virtual study - Description',
    userID: 'DEFAULT',
    created: '',
    filters: '',
    samplesLength: '',
    patientsLength: '',
    selectedCases: ''
  };

  var selectedCase = {
    studyID: '',
    samples: [],
    patients: []
  };


  var generateUUID = function() {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === 'function') {
      d += window.performance.now();
    }
    var uuid = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
      function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    return uuid;
  };

  // Get Virtual cohorts from Local Storage
  var getVirtualCohorts = function() {
    return JSON.parse(localStorage.getItem('virtual-cohorts')) || [];
  };

  // Set Virtual cohorts in Local Storage
  var setVirtualCohorts = function(virtualCohorts) {
    localStorage.setItem('virtual-cohorts', JSON.stringify(virtualCohorts));
  };

  var buildVCObject = function(filters, patientsLength,
                               samplesLength, cases, userID, name,
                               description) {
    var _virtualCohort = $.extend(true, {}, virtualCohort);
    _virtualCohort.filters = filters;
    _virtualCohort.selectedCases = cases;
    _virtualCohort.samplesLength = samplesLength;
    _virtualCohort.patientsLength = patientsLength;
    _virtualCohort.created = new Date().getTime();
    if (name) {
      _virtualCohort.studyName = name;
    }
    if (description) {
      _virtualCohort.description = description;
    }
    if (userID) {
      _virtualCohort.userID = userID;
    }
    return _virtualCohort;
  };
  var buildCaseListObject = function(cancerStudyID, sampleID) {
    var _selectedCases = [];
    var _selectedCase = $.extend(true, {}, selectedCase);
    _selectedCase.studyID = cancerStudyID;
    _selectedCase.samples.push(sampleID);
    _selectedCases.push(_selectedCase);
    return _selectedCases;
  };

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
    buildVCObject: buildVCObject,
    setVirtualCohorts: setVirtualCohorts,
    getVirtualCohorts: getVirtualCohorts,
    generateUUID: generateUUID,
    buildCaseListObject: buildCaseListObject
  }
}());
