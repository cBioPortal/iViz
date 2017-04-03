'use strict';
window.vcSession = window.vcSession ? window.vcSession : {};

(function(vcSession, _) {
  if (!_.isObject(vcSession)) {
    vcSession = {};
  }
  vcSession.events = (function() {
    return {
      saveCohort: function(stats, selectedPatientsNum, selectedSamplesNum,
                           userID, name, description) {
        var def = new $.Deferred();
        var _virtualCohort = vcSession.utils.buildVCObject(stats.filters,
          selectedPatientsNum, selectedSamplesNum, stats.selected_cases,
          userID,
          name, description);
        vcSession.model.saveSession(_virtualCohort)
          .done(function() {
            def.resolve();
          })
          .fail(function() {
            def.reject();
          });
        return def.promise();
      },
      removeVirtualCohort: function(virtualCohort) {
        vcSession.model.removeSession(virtualCohort);
      },
      editVirtualCohort: function(virtualCohort) {
        vcSession.model.editSession(virtualCohort);
      },
      addSampleToVirtualCohort: function(virtualCohortID, cancerStudyID,
                                         sampleID) {
        var _returnString = 'error';
        var _virtualCohorts = vcSession.utils.getVirtualCohorts();
        var _studyMatch = _.findWhere(_virtualCohorts, {
          virtualCohortID: virtualCohortID
        });
        if (typeof _studyMatch === 'undefined') {
          /*
           TODO : if virtual cohort is not present in local storage
           */
          console.log('virtual cohort not found');
        } else {
          var _match = _.findWhere(_studyMatch.selectedCases, {
            studyID: cancerStudyID
          });
          if (typeof _match === 'undefined') {
            var _selectedCases = vcSession.utils.buildCaseListObject(
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
})(window.vcSession,
  window._);
