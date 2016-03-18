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

  var patientChartsInst, sampleChartsInst;
  var selectedPatients = [], selectedSamples = [];
  var data, vm, grid;

  return {
    init: function() {

      $("#main-grid").empty();

      // TODO: replace with wrapper to assemble data from web APIs
      $.ajax({url: "data/converted/mixed_tcga.json"})
        .then(function (_data) {

          data = _data;

          // ---- fill the empty slots in the data matrix ----
          _.each(data.groups.patient.data, function(_dataObj) {
            _.each(_.pluck(data.groups.patient.attr_meta, "attr_id"), function (_attrId) {
              if (!_dataObj.hasOwnProperty(_attrId)) {
                _dataObj[_attrId] = "NA";
              }
            });
          });
          _.each(data.groups.sample.data, function(_dataObj) {
            _.each(_.pluck(data.groups.sample.attr_meta, "attr_id"), function (_attrId) {
              if (!_dataObj.hasOwnProperty(_attrId)) {
                _dataObj[_attrId] = "NA";
              }
            });
          });

          // ----  init and define dc chart instances ----
          patientChartsInst = new dcCharts(
            data.groups.patient.attr_meta,
            data.groups.patient.data,
            data.groups.group_mapping,
            "patient"
          );
          sampleChartsInst = new dcCharts(
            data.groups.sample.attr_meta,
            data.groups.sample.data,
            data.groups.group_mapping,
            "sample"
          );

          // ---- render dc charts ----
          grid = new Packery(document.querySelector('.grid'), {
            itemSelector: '.grid-item',
            columnWidth: 250,
            rowHeight: 250,
            gutter: 5
          });

          _.each(grid.getItemElements(), function (gridItem) {
            var draggie = new Draggabilly(gridItem, {
              handle: '.dc-chart-drag'
            });
            grid.bindDraggabillyEvents(draggie);
          });

          dc.renderAll();
          grid.layout();

          // ---- set default selected cases ----
          selectedPatients = _.pluck(data.groups.patient.data, "patient_id");
          selectedSamples = _.pluck(data.groups.sample.data, "sample_id");

          // --- using vue to show filters in header ---
          if (typeof vm === "undefined") {
            vm = new Vue({
              el: '#main-header',
              data: {
                filters: [],
                selectedSamplesNum: _.pluck(data.groups.sample.data, "sample_id").length,
                selectedPatientsNum: _.pluck(data.groups.patient.data, "patient_id").length
              }
            });
          } else {
            vm.filters = [];
            vm.selectedSamplesNum = _.pluck(data.groups.sample.data, "sample_id").length;
            vm.selectedPatientsNum = _.pluck(data.groups.patient.data, "patient_id").length;
          }

        });
    }, // ---- close init function ----
    
    stat: function() {
      var result = {};
      result["filters"] = {};
      
      // extract and reformat selected cases
      var _selectedCases = [];
  
      _.each(selectedSamples, function(_selectedSample) {
    
        var _index = data.groups.sample.data_indices.sample_id[_selectedSample];
        var _studyId = data.groups.sample.data[_index]["study_id"];
    
        // extract study information
        if ($.inArray(_studyId, _.pluck(_selectedCases, "studyID")) !== -1) {
          _.each(_selectedCases, function(_resultObj) {
            if (_resultObj["studyID"] === _studyId) {
              _resultObj["samples"].push(_selectedSample);
            }
          });
        } else {
          _selectedCases.push({"studyID": _studyId, "samples": [_selectedSample]});
        }
    
        //map samples to patients
        _.each(_selectedCases, function(_resultObj) {
          _resultObj["patients"] = iViz.util.idMapping(data.groups.group_mapping.sample.patient, _resultObj["samples"]);
        });
    
      });
  
      result.filters["patients"] = patientChartsInst.filters();
      result.filters["samples"] = sampleChartsInst.filters();
      result["selected_cases"] = _selectedCases;
      
      return result;
    },
    
    vm: function() {
      return vm;
    },
    view: {
      component: {},
      grid: {
        get: function () {
          return grid;
        },
        layout: function () {
          grid.layout();
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
      return (_type === "patient")? data.groups.patient.data: data.groups.sample.data;
    },
    getMapping: function() {
      return data.groups.group_mapping;
    },
    patientChartsInst: function() {
      return patientChartsInst;
    },
    sampleChartsInst: function() {
      return sampleChartsInst;
    },
    setSelectedSamples: function(_input) {
      selectedSamples = _input;
    },
    getSelectedSamples: function() {
      return selectedSamples;
    },
    setSelectedPatients: function(_input) {
      selectedPatients = _input;
    },
    getSelectedPatients: function() {
      return selectedPatients;
    }

  }
}());




