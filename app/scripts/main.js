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

var iViz = (function(_, $) {
  
  var patientChartsInst_;
  var sampleChartsInst_;
  var selectedPatients_ = [];
  var selectedSamples_ = [];
  var data_;
  var vm_;
  var grid_;
  
  return {
    init: function(_studyIdArr, _inputSampleList, _inputPatientList) {
  
      $('#main-grid').empty();
      $('#main-grid').append('<img src="images/ajax-loader.gif" style="padding:200px;"/>');
      
      iViz.data.init(_studyIdArr, dataInitCallbackFunc_, _inputSampleList, _inputPatientList);
      
      function dataInitCallbackFunc_(_data, _inputSampleList, _inputPatientList) {
  
        $('#main-grid').empty();
        data_ = _data;
        
        // TODO: should filter with setter/getter
        if (_inputSampleList !== undefined && _inputPatientList !== undefined) {
          var _sampleData = _.filter(_data.groups.sample.data, function (_dataObj) {
            return $.inArray(_dataObj['sample_id'], _inputSampleList) !== -1
          });
          var _sampleDataIndices = {};
          for (var _i = 0; _i < _sampleData.length; _i++) {
            _sampleDataIndices[_sampleData[_i].sample_id] = _i;
          }
          var _patientData = _.filter(_data.groups.patient.data, function (_dataObj) {
            return $.inArray(_dataObj['patient_id'], _inputPatientList) !== -1
          });
          var _patientDataIndices = {};
          for (var _j = 0; _j < _patientData.length; _j++) {
            _patientDataIndices[_patientData[_j].patient_id] = _j;
          }
          
          data_.groups.patient.data = _patientData;
          data_.groups.sample.data = _sampleData;
          data_.groups.patient.data_indices.patient_id = _patientDataIndices;
          data_.groups.sample.data_indices.sample_id = _sampleDataIndices;
        }
        
        // ---- generating data matrix & fill the empty slots ----
        _.each(data_.groups.patient.data, function (_dataObj) {
          _.each(_.pluck(data_.groups.patient.attr_meta, 'attr_id'), function (_attrId) {
            if (!_dataObj.hasOwnProperty(_attrId)) {
              _dataObj[_attrId] = 'NA';
            }
          });
        });
        _.each(data_.groups.sample.data, function (_dataObj) {
          _.each(_.pluck(data_.groups.sample.attr_meta, 'attr_id'), function (_attrId) {
            if (!_dataObj.hasOwnProperty(_attrId)) {
              _dataObj[_attrId] = 'NA';
            }
          });
        });
        
        // ----  init and define dc chart instances ----
        patientChartsInst_ = new iViz.dcCharts(
          data_.groups.patient.attr_meta,
          data_.groups.patient.data,
          data_.groups.group_mapping,
          'patient'
        );
        sampleChartsInst_ = new iViz.dcCharts(
          data_.groups.sample.attr_meta,
          data_.groups.sample.data,
          data_.groups.group_mapping,
          'sample'
        );
        
        // ---- render dc charts ----
        grid_ = new Packery(document.querySelector('.grid'), {
          itemSelector: '.grid-item',
          columnWidth: 250,
          rowHeight: 250,
          gutter: 5
        });
        
        _.each(grid_.getItemElements(), function (_gridItem) {
          var _draggie = new Draggabilly(_gridItem, {
            handle: '.dc-chart-drag'
          });
          grid_.bindDraggabillyEvents(_draggie);
        });
        
        dc.renderAll();
        grid_.layout();
        
        // ---- set default selected cases ----
        selectedPatients_ = _.pluck(data_.groups.patient.data, 'patient_id');
        selectedSamples_ = _.pluck(data_.groups.sample.data, 'sample_id');
        
        // --- using vue to show filters in header ---
        if (typeof vm_ === "undefined") {
          vm_ = iViz.session.manage.getInstance();
          vm_.selectedSamplesNum = _.pluck(data_.groups.sample.data, 'sample_id').length;
          vm_.selectedPatientsNum = _.pluck(data_.groups.patient.data, 'patient_id').length;
          vm_.filters = [];
        } else {
          vm_.filters = [];
          vm_.selectedSamplesNum = _.pluck(data_.groups.sample.data, 'sample_id').length;
          vm_.selectedPatientsNum = _.pluck(data_.groups.patient.data, 'patient_id').length;
        }
        
      };
    }, // ---- close init function ----
    
    stat: function () {
      var _result = {};
      _result['filters'] = {};
      
      // extract and reformat selected cases
      var _selectedCases = [];
      
      _.each(selectedSamples_, function (_selectedSample) {
        
        var _index = data_.groups.sample.data_indices.sample_id[_selectedSample];
        var _studyId = data_.groups.sample.data[_index]['study_id'];
        
        // extract study information
        if ($.inArray(_studyId, _.pluck(_selectedCases, 'studyID')) !== -1) {
          _.each(_selectedCases, function (_resultObj) {
            if (_resultObj['studyID'] === _studyId) {
              _resultObj['samples'].push(_selectedSample);
            }
          });
        } else {
          _selectedCases.push({'studyID': _studyId, 'samples': [_selectedSample]});
        }
        
        // map samples to patients
        _.each(_selectedCases, function (_resultObj) {
          _resultObj['patients'] = iViz.util.idMapping(data_.groups.group_mapping.sample.patient, _resultObj['samples']);
        });
        
      });
      
      _result.filters['patients'] = patientChartsInst_.filters();
      _result.filters['samples'] = sampleChartsInst_.filters();
      _result['selected_cases'] = _selectedCases;
      
      return _result;
    },
    
    vm: function () {
      return vm_;
    },
    view: {
      component: {},
      grid: {
        get: function () {
          return grid_;
        },
        layout: function () {
          grid_.layout();
        }
      }
    },
    util: {},
    opts: {
      dc: {
        transitionDuration: 400
      }
    },
    getData: function (_type) {
      return (_type === 'patient') ? data_.groups.patient.data : data_.groups.sample.data;
    },
    getMapping: function () {
      return data_.groups.group_mapping;
    },
    patientChartsInst: function () {
      return patientChartsInst_;
    },
    sampleChartsInst: function () {
      return sampleChartsInst_;
    },
    setSelectedSamples: function (_input) {
      selectedSamples_ = _input;
    },
    getSelectedSamples: function () {
      return selectedSamples_;
    },
    setSelectedPatients: function (_input) {
      selectedPatients_ = _input;
    },
    getSelectedPatients: function () {
      return selectedPatients_;
    },
    //applyVC: function (_vc) {
    //  var _selectedSamples = [], _selectedPatients = [];
    //  _.each(_.pluck(_vc.selectedCases, "samples"), function (_arr) {
    //    _selectedSamples = _selectedSamples.concat(_arr);
    //  });
    //  _.each(_.pluck(_vc.selectedCases, "patients"), function (_arr) {
    //    _selectedPatients = _selectedPatients.concat(_arr);
    //  });
    //  iViz.init(["ov_tcga_pub", "ucec_tcga_pub", "blca_tcga_pub", "lgg_ucsf_2014"], _selectedSamples, _selectedPatients);
    //},
    //resetAll: function() {
    //  var _selectedStudyIds = []
    //  var _currentURL = window.location.href;
    //  if (_currentURL.indexOf("vc_id") !== -1 && _currentURL.indexOf("study_id") !== -1) {
    //    var _vcId;
    //    var query = location.search.substr(1);
    //    _.each(query.split('&'), function(_part) {
    //      var item = _part.split('=');
    //      if (item[0] === 'vc_id') {
    //        _vcId = item[1];
    //      } else if (item[0] === 'study_id') {
    //        _selectedStudyIds = _selectedStudyIds.concat(item[1].split(','));
    //      }
    //    });
    //    $.getJSON(URL + _vcId, function(response) {
    //      _selectedStudyIds = _selectedStudyIds.concat(_.pluck(response.data.virtualCohort.selectedCases, "studyID"));
    //      var _selectedPatientIds = [];
    //      _.each(_.pluck(response.data.virtualCohort.selectedCases, "patients"), function(_patientIds) {
    //        _selectedPatientIds = _selectedPatientIds.concat(_patientIds);
    //      });
    //      var _selectedSampleIds = [];
    //      _.each(_.pluck(response.data.virtualCohort.selectedCases, "samples"), function(_sampleIds) {
    //        _selectedSampleIds = _selectedSampleIds.concat(_sampleIds);
    //      });
    //      iViz.init(_selectedStudyIds, _selectedSampleIds, _selectedPatientIds);
    //    });
    //  } else if (_currentURL.indexOf("vc_id") === -1 && _currentURL.indexOf("study_id") !== -1) {
    //    _selectedStudyIds = _selectedStudyIds.concat(location.search.split('study_id=')[1].split(','));
    //    iViz.init(_selectedStudyIds);
    //  } else if (_currentURL.indexOf("vc_id") !== -1 && _currentURL.indexOf("study_id") === -1) {
    //    var _vcId = location.search.split('vc_id=')[1];
    //    $.getJSON(URL + _vcId, function(response) {
    //      _selectedStudyIds = _selectedStudyIds.concat(_.pluck(response.data.virtualCohort.selectedCases, "studyID"));
    //      var _selectedPatientIds = [];
    //      _.each(_.pluck(response.data.virtualCohort.selectedCases, "patients"), function(_patientIds) {
    //        _selectedPatientIds = _selectedPatientIds.concat(_patientIds);
    //      });
    //      var _selectedSampleIds = [];
    //      _.each(_.pluck(response.data.virtualCohort.selectedCases, "samples"), function(_sampleIds) {
    //        _selectedSampleIds = _selectedSampleIds.concat(_sampleIds);
    //      });
    //      iViz.init(_selectedStudyIds, _selectedSampleIds, _selectedPatientIds);
    //    });
    //  }
    //}
    
  }
}(window._, window.$));




