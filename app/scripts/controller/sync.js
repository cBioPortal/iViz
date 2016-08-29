/**
 * @author suny1@mskcc.org on 3/15/16.
 */

'use strict';
(function(iViz, $, _) {
  iViz.sync = {};
  // syncing util: select samples or patients based on only samples/patients filters
  iViz.sync.selectByFilters = function(filters, data) { // type: sample or patient
    var _selectedCasesData = data;
    _.each(Object.keys(filters), function(_filterAttrId) {
      var tempData = _selectedCasesData;
      _selectedCasesData = [];
      var _filtersForSingleAttr = filters[_filterAttrId];
      if (iViz.util.isRangeFilter(_filtersForSingleAttr)) {
        var _filterRangeMin = parseFloat(_filtersForSingleAttr[0]);
        var _filterRangeMax = parseFloat(_filtersForSingleAttr[1]);
        _.each(tempData, function(_dataObj) {
          if (_dataObj.hasOwnProperty(_filterAttrId)) {
            if (parseFloat(_dataObj[_filterAttrId]) <= _filterRangeMax &&
              parseFloat(_dataObj[_filterAttrId]) >= _filterRangeMin) {
              _selectedCasesData.push(_dataObj);
            }
          }
        });
      } else {
        _.each(tempData, function(_dataObj) {
          if (_dataObj.hasOwnProperty(_filterAttrId)) {
            if ($.inArray(_dataObj[_filterAttrId],
                _filtersForSingleAttr) !== -1) {
              _selectedCasesData.push(_dataObj);
            }
          }
        });
      }
    });
    return _selectedCasesData;
  };

  iViz.sync.selectByCases = function(type_, data_, cases_) {
    var caseIndices = iViz.getCaseIndices(type_);
    var resultData_ = [];
    _.each(cases_, function(val) {
      resultData_.push(data_[caseIndices[val]]);
    });
    return resultData_;
  };

  return iViz.sync;
})(window.iViz, window.$, window._);

