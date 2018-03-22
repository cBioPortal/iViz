'use strict';

(function(vcSession, _, $) {
  if (!_.isObject(vcSession)) {
    vcSession = {};
  }
  vcSession.utils = (function() {
    var virtualCohort_ = {
      name: '',
      description: '',
      filters: '',
      studies: '',
      origin:''
    };

    var buildVCObject_ = function(stats, name,
                                  description) {
      var def = new $.Deferred();
      var _virtualCohort = $.extend(true, {}, virtualCohort_);
      _virtualCohort.filters = stats.filters;
      
      _virtualCohort.studies = stats.studies.map(function(studyObj) {
        return {
          id: studyObj.id,
          samples: studyObj.samples
        };
      });
      _virtualCohort.origin = stats.origin;
      if (name) {
        _virtualCohort.name = name;
      } else {
        _virtualCohort.name = getVSDefaultName();
      }
      _virtualCohort.description = description || '';
      def.resolve(_virtualCohort);
      return def.promise();
    };

    var getNumOfSelectedSamplesFromStudyMap = function(studyMap) {
      var _numOfSamples = 0;
      _.each(studyMap, function(_study) {
        _numOfSamples += _study.samples.length;
      });
      return _numOfSamples;
    };
    
    var generateVSDescription_ = function(_cases) {
      var _desp = '';
      if (_cases.length >= 1) {
        var _numOfSamples = getNumOfSelectedSamplesFromStudyMap(_cases);
        _desp = _numOfSamples + (_numOfSamples > 1 ? ' samples ' : ' sample ') 
          + 'from ' + _cases.length +
          (_cases.length > 1 ? ' studies' : ' study') + ' (' + getCurrentDate() + ')';
      }
      return _desp;
    };

    var getCurrentDate = function() {
      var _date = new Date();
      var strArr = [_date.getFullYear(), _date.getMonth(), _date.getDate()];
      return strArr.join('-');
    };

    var getVSDefaultName = function(studyMap) {
      var _numOfSamples = getNumOfSelectedSamplesFromStudyMap(studyMap);
      return 'Selected ' + (_numOfSamples > 1 ? 'samples' : 'sample')
        + ' (' + getCurrentDate() + ')';
    };

    return {
      buildVCObject: buildVCObject_,
      VSDefaultName: getVSDefaultName,
      generateVSDescription: generateVSDescription_
    };
  })();
})(window.vcSession,
  window._,
  window.$ || window.jQuery);
