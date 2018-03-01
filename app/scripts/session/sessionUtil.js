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
        _virtualCohort.name = cases.length > 1 ? "Combined Study" : "Selected Study";
      }
      _virtualCohort.description = description || '';
      def.resolve(_virtualCohort);
      return def.promise();
    };

    var generateVSDescription_ = function(_cases) {
      var def = new $.Deferred(), _desp = "";
      $.when(window.iviz.datamanager.getCancerStudyDisplayName(_.pluck(_cases, "id"))).done(function(_studyIdNameMap) {
        _.each(_cases, function (_i) {
          _desp += _studyIdNameMap[_i.id] + ": " + _i.samples.length + " samples\n";
        });
        def.resolve(_desp);
      });
      return def.promise();
    }

    return {
      buildVCObject: buildVCObject_,
      VSDefaultName: 'Selected Study',
      generateVSDescription: generateVSDescription_
    };
  })();
})(window.vcSession,
  window._,
  window.$ || window.jQuery);
