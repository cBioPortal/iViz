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
iViz.session.events = (function() {
  return {
    saveCohort: function(_stats, _selectedPatientsNum, _selectedSamplesNum,
                         userID, name, description) {

      var _virtualCohort = iViz.session.utils.buildVCObject(_stats.filters,
        _selectedPatientsNum, _selectedSamplesNum, _stats.selected_cases,
        userID,
        name, description);
      iViz.session.model.saveSession(_virtualCohort);
    },
    removeVirtualCohort: function(_virtualCohort) {
      iViz.session.manage.getinstance().virtualCohorts.$remove(_virtualCohort);
      iViz.session.model.removeSession(_virtualCohort);
    },
    editVirtualCohort: function(virtualCohort) {
      iViz.session.model.editSession(virtualCohort);
    },
    addSampleToVirtualCohort: function(virtualCohortID, cancerStudyID,
                                       sampleID) {
      var returnString = 'error';
      var virtualCohorts = iViz.session.utils.getVirtualCohorts();
      var studyMatch = _.findWhere(virtualCohorts, {
        virtualCohortID: virtualCohortID
      });
      if (typeof studyMatch === 'undefined') {
        /*
         TODO : if virtual study is not present in local storage
         */
        console.log('virtual cohort not found');
      } else {
        var match = _.findWhere(studyMatch.selectedCases, {
          studyID: cancerStudyID
        });
        if (typeof match === 'undefined') {
          var _selectedCase = {
            studyID: '',
            samples: [],
            patients: []
          };
          _selectedCase.studyID = cancerStudyID;
          _selectedCase.samples.push(sampleID);
          var _selectedCases = [];
          _selectedCases.push(_selectedCase);
          studyMatch.selectedCases = _selectedCases;
          studyMatch.samplesLength += 1;
          returnString = 'success';
        } else if (_.contains(match.samples, sampleID)) {
          returnString = 'warn';
        } else {
          match.samples.push(sampleID);
          studyMatch.samplesLength += 1;
          returnString = 'success';
        }
        this.editVirtualCohort(studyMatch);
      }
      return returnString;
    }
  }

}());
