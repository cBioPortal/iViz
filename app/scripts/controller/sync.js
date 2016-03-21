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

/*!
 Functions to sync patient charts group and sample charts group 
*/

iViz.sync = (function() {
  return {
  
    // ---- callback function to sync patients charts and sample charts ----
    // @selected_cases: cases selected in the other group
    // @update_type: the type of group charts (patient or sample) that needs to be updated
    callBack: function(updateType) {
    
        var _selectedSamplesByFiltersOnly = iViz.sync.selectByFilters(iViz.sampleChartsInst().filters(), iViz.getData('sample'), 'sample');
        var _selectedPatientsByFiltersOnly = iViz.sync.selectByFilters(iViz.patientChartsInst().filters(), iViz.getData('patient'), 'patient');
    
        // find the intersection between two groups
        var mappedSelectedSamples = iViz.util.idMapping(iViz.getMapping().patient.sample, _selectedPatientsByFiltersOnly);
        iViz.setSelectedSamples(_.intersection(mappedSelectedSamples, _selectedSamplesByFiltersOnly));
        iViz.setSelectedPatients(iViz.util.idMapping(iViz.getMapping().sample.patient, iViz.getSelectedSamples()));
    
        // sync view
        if (updateType === 'sample') {
          iViz.sampleChartsInst().sync(iViz.util.idMapping(iViz.getMapping().patient.sample, _selectedPatientsByFiltersOnly));
        } else if (updateType === 'patient') {
          iViz.patientChartsInst().sync(iViz.util.idMapping(iViz.getMapping().sample.patient, _selectedSamplesByFiltersOnly));
        }
    
        // update vue
        iViz.vm().filters = [];
        iViz.vm().filters.length = 0;
        _.each(Object.keys(iViz.patientChartsInst().filters()), function(_key) {
          iViz.vm().filters.push({ text : '<span class="label label-primary">' + _key + ': ' + iViz.patientChartsInst().filters()[_key] + '</span>' });
        });
        _.each(Object.keys(iViz.sampleChartsInst().filters()), function(_key) {
          iViz.vm().filters.push({ text : '<span class="label label-info">' + _key + ': ' + iViz.sampleChartsInst().filters()[_key] + '</span>' });
        });
        iViz.vm().selectedSamplesNum = iViz.getSelectedSamples().length;
        iViz.vm().selectedPatientsNum = iViz.getSelectedPatients().length;
    
    },

    // syncing util: select samples or patients based on only samples/patients filters
    selectByFilters: function(filters, data, type) { //type: sample or patient
      var _dupSelectedCasesArr = [];
      _.each(Object.keys(filters), function(_filterAttrId) {
      
        var _singleAttrSelectedCases = [];
        var _filtersForSingleAttr = filters[_filterAttrId];
      
        if (iViz.util.isRangeFilter(_filtersForSingleAttr)) {
        
          var _filterRangeMin = parseFloat(_filtersForSingleAttr[0]);
          var _filterRangeMax = parseFloat(_filtersForSingleAttr[1]);
          _.each(data, function(_dataObj) {
            if (_dataObj.hasOwnProperty(_filterAttrId)) {
              if (parseFloat(_dataObj[_filterAttrId]) <= _filterRangeMax && parseFloat(_dataObj[_filterAttrId]) >= _filterRangeMin) {
                _singleAttrSelectedCases.push(type === 'sample'? _dataObj.sample_id: _dataObj.patient_id);
              }
            }
          });
        
        } else {
          _.each(data, function(_dataObj) {
            if (_dataObj.hasOwnProperty(_filterAttrId)) {
              if ($.inArray(_dataObj[_filterAttrId], _filtersForSingleAttr) !== -1) {
                _singleAttrSelectedCases.push(type === 'sample'? _dataObj.sample_id: _dataObj.patient_id);
              }
            }
          });
        }
        _dupSelectedCasesArr.push(_singleAttrSelectedCases);
      });
      var _selectedCasesByFiltersOnly = _.pluck(data, type === 'sample'? 'sample_id': 'patient_id');
      if (_dupSelectedCasesArr.length !== 0) {
        _.each(_dupSelectedCasesArr, function(_dupSelectedCases) {
          _selectedCasesByFiltersOnly = _.intersection(_selectedCasesByFiltersOnly, _dupSelectedCases);
        });
      }
      return _selectedCasesByFiltersOnly;
    }
  
  }
}());