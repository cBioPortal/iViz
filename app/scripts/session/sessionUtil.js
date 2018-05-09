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
      origin: ''
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
      var _numOfSamples = {
        sampleCounts__: 0,
        studies: {}
      };
      _.each(studyMap, function(_study) {
        _numOfSamples.studies[_study.id] = _study.samples.length;
        _numOfSamples.sampleCounts__ += _study.samples.length;
      });
      return _numOfSamples;
    };

    var generateVSDescription_ = function(_studies, _filters) {
      var _desp = '';
      if (_studies.studies.length > 0) {
        _desp = _studies.count + (_studies.count > 1 ? ' samples ' : ' sample ')
          + 'from ' + _studies.studies.length +
          (_studies.studies.length > 1 ? ' studies' : ' study') + ':';

        _.each(_studies.studies, function(_study) {
          _desp += '\n- ' + _study.name + ' ('
            + _study.count + ' sample' + (_study.count > 1 ? 's' : '') + ')';
        });

        if (_filters.length > 0) {
          _desp += '\n\nFilter' + (_filters.length > 1 ? 's' : '') + ':';
          _filters.sort(function(a, b) {
            return a.attrName.localeCompare(b.attrName);
          });
          _.each(_filters, function(_filter) {
            _desp += '\n- ' + _filter.attrName + ': ';
            if (_filter.viewType === 'bar_chart') {
              _desp += iViz.util.getDisplayBarChartBreadCrumb(_filter.filter);
            } else if (_filter.viewType === 'table'
              && ['mutated_genes', 'cna_details'].indexOf(_filter.attrId) !== -1) {
              _.each(_filter.filter, function(subSelection) {
                _desp += '\n  - ' + subSelection;
              });
            } else if (_filter.viewType === 'scatter_plot' || _filter.viewType === 'custom') {
              _desp += _filter.filter.length + ' sample'
                + (_filter.filter.length > 1 ? 's' : '');
            } else {
              _desp += _filter.filter.join(', ');
            }
          });
        }

        _desp += '\n\nCreated on  ' + getCurrentDate();

        if (window.userEmailAddress && window.userEmailAddress !== 'anonymousUser') {
          _desp += ' by ' + window.userEmailAddress;
        }
      }
      return _desp;
    };

    var getCurrentDate = function() {
      var _date = new Date();
      var strArr = [_date.getFullYear(), _date.getMonth() + 1, _date.getDate()];
      return strArr.join('-');
    };

    var getVSDefaultName = function(studyMap) {
      var _numOfSamples = getNumOfSelectedSamplesFromStudyMap(studyMap);
      return 'Selected ' + (_numOfSamples.sampleCounts__ > 1 ? 'samples' : 'sample')
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
