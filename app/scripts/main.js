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

var iViz = (function() {

  var patientChartsInst_, sampleChartsInst_;
  var selectedPatients_ = [], selectedSamples_ = [];
  var data_, vm_, grid_;

  return {
    init: function() {

      $('#main-grid').empty();

      // TODO: replace with wrapper to assemble data_ from web APIs
      $.ajax({url: 'data/converted/mixed_tcga.json'})
        .then(function (_data) {

          data_ = _data;

          // ---- fill the empty slots in the data matrix ----
          _.each(data_.groups.patient.data, function(_dataObj) {
            _.each(_.pluck(data_.groups.patient.attr_meta, 'attr_id'), function (_attrId) {
              if (!_dataObj.hasOwnProperty(_attrId)) {
                _dataObj[_attrId] = 'NA';
              }
            });
          });
          _.each(data_.groups.sample.data, function(_dataObj) {
            _.each(_.pluck(data_.groups.sample.attr_meta, 'attr_id'), function (_attrId) {
              if (!_dataObj.hasOwnProperty(_attrId)) {
                _dataObj[_attrId] = 'NA';
              }
            });
          });

          // ----  init and define dc chart instances ----
          patientChartsInst_ = new dcCharts(
            data_.groups.patient.attr_meta,
            data_.groups.patient.data,
            data_.groups.group_mapping,
            'patient'
          );
          sampleChartsInst_ = new dcCharts(
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
          if (typeof vm === "undefined") {
            vm_ = iViz.session.manage.getInstance();
            vm_.selectedSamplesNum = _.pluck(data_.groups.sample.data, 'sample_id').length;
            vm_.selectedPatientsNum = _.pluck(data_.groups.patient.data, 'patient_id').length;
            vm_.filters = [];
          } else {
            vm_.filters = [];
            vm_.selectedSamplesNum = _.pluck(data_.groups.sample.data, 'sample_id').length;
            vm_.selectedPatientsNum = _.pluck(data_.groups.patient.data, 'patient_id').length;
          }

        });
    }, // ---- close init function ----
    
    stat: function() {
      var _result = {};
      _result['filters'] = {};
      
      // extract and reformat selected cases
      var _selectedCases = [];
  
      _.each(selectedSamples_, function(_selectedSample) {
    
        var _index = data_.groups.sample.data_indices.sample_id[_selectedSample];
        var _studyId = data_.groups.sample.data[_index]['study_id'];
    
        // extract study information
        if ($.inArray(_studyId, _.pluck(_selectedCases, 'studyID')) !== -1) {
          _.each(_selectedCases, function(_resultObj) {
            if (_resultObj['studyID'] === _studyId) {
              _resultObj['samples'].push(_selectedSample);
            }
          });
        } else {
          _selectedCases.push({'studyID': _studyId, 'samples': [_selectedSample]});
        }
    
        //map samples to patients
        _.each(_selectedCases, function(_resultObj) {
          _resultObj['patients'] = iViz.util.idMapping(data_.groups.group_mapping.sample.patient, _resultObj['samples']);
        });
    
      });
  
      _result.filters['patients'] = patientChartsInst_.filters();
      _result.filters['samples'] = sampleChartsInst_.filters();
      _result['selected_cases'] = _selectedCases;
      
      return _result;
    },
    
    vm: function() {
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
    getData: function(_type) {
      return (_type === 'patient')? data_.groups.patient.data: data_.groups.sample.data;
    },
    getMapping: function() {
      return data_.groups.group_mapping;
    },
    patientChartsInst: function() {
      return patientChartsInst_;
    },
    sampleChartsInst: function() {
      return sampleChartsInst_;
    },
    setSelectedSamples: function(_input) {
      selectedSamples_ = _input;
    },
    getSelectedSamples: function() {
      return selectedSamples_;
    },
    setSelectedPatients: function(_input) {
      selectedPatients_ = _input;
    },
    getSelectedPatients: function() {
      return selectedPatients_;
    },
    applyFitlers: function() {
      console.log(patientChartsInst_.filters());
      console.log(sampleChartsInst_.filters());
    },
    applySamples: function() {
      
      
    }
  }
}());




