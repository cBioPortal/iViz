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
 * @author suny1@mskcc.org on 3/15/16.
 */

'use strict';
(function(iViz, $, _){
  iViz.sync = {};
  // syncing util: select samples or patients based on only samples/patients filters
  iViz.sync.selectByFilters = function(filters, data) { // type: sample or patient
    var _selectedCasesData = data;
    _.each(Object.keys(filters), function(_filterAttrId) {
    
      var tempData = _selectedCasesData;
      _selectedCasesData=[];
      var _singleAttrSelectedCases =[];
      var _filtersForSingleAttr = filters[_filterAttrId];
      if (iViz.util.isRangeFilter(_filtersForSingleAttr)) {
      
        var _filterRangeMin = parseFloat(_filtersForSingleAttr[0]);
        var _filterRangeMax = parseFloat(_filtersForSingleAttr[1]);
        _.each(tempData, function(_dataObj) {
          if (_dataObj.hasOwnProperty(_filterAttrId)) {
            if (parseFloat(_dataObj[_filterAttrId]) <= _filterRangeMax && parseFloat(_dataObj[_filterAttrId]) >= _filterRangeMin) {
              _selectedCasesData.push(_dataObj);
            }
          }
        });
      
      } else {
        _.each(tempData, function(_dataObj) {
          if (_dataObj.hasOwnProperty(_filterAttrId)) {
            if ($.inArray(_dataObj[_filterAttrId], _filtersForSingleAttr) !== -1) {
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
    $.each(cases_, function(key,val){
      resultData_.push(data_[caseIndices[val]]);
    });
    return resultData_;
  };
  
  return iViz.sync;
}(window.iViz, window.$, window._));

