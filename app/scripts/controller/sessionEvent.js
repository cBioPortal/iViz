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
(function(iViz, _) {
  iViz.session.events = (function() {
    return {
      saveCohort: function(stats, selectedPatientsNum, selectedSamplesNum,
                           userID, name, description) {
        var _virtualCohort = iViz.session.utils.buildVCObject(stats.filters,
          selectedPatientsNum, selectedSamplesNum, stats.selected_cases,
          userID,
          name, description);
        iViz.session.model.saveSession(_virtualCohort);
      },
      removeVirtualCohort: function(virtualCohort) {
        iViz.session.manage.getInstance().virtualCohorts.$remove(virtualCohort);
        iViz.session.model.removeSession(virtualCohort);
      },
      editVirtualCohort: function(virtualCohort) {
        iViz.session.model.editSession(virtualCohort);
      },
      addSampleToVirtualCohort: function(virtualCohortID, cancerStudyID,
                                         sampleID) {
        var _returnString = 'error';
        var _virtualCohorts = iViz.session.utils.getVirtualCohorts();
        var _studyMatch = _.findWhere(_virtualCohorts, {
          virtualCohortID: virtualCohortID
        });
        if (typeof _studyMatch === 'undefined') {
          /*
           TODO : if virtual study is not present in local storage
           */
          console.log('virtual cohort not found');
        } else {
          var _match = _.findWhere(_studyMatch.selectedCases, {
            studyID: cancerStudyID
          });
          if (typeof _match === 'undefined') {
            var _selectedCases = iViz.session.utils.buildCaseListObject(
              _studyMatch.selectedCases, cancerStudyID, sampleID);
            _studyMatch.selectedCases = _selectedCases;
            _studyMatch.samplesLength += 1;
            _returnString = 'success';
          } else if (_.contains(_match.samples, sampleID)) {
            _returnString = 'warn';
          } else {
            _match.samples.push(sampleID);
            _studyMatch.samplesLength += 1;
            _returnString = 'success';
          }
          this.editVirtualCohort(_studyMatch);
        }
        return _returnString;
      }
    };
  })();
})(window.iViz,
  window._);
