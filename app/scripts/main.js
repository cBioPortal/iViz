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

var iViz = (function (_, $) {

  var data_;
  var vm_;
  var grid_;

  return {

    init: function (_rawDataJSON, _inputSampleList, _inputPatientList) {

      vm_ = iViz.vue.manage.getInstance();

      data_ = _rawDataJSON;

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

      var _patientIds = _.keys(data_.groups.patient.data_indices.patient_id);
      var _sampleIds = _.keys(data_.groups.sample.data_indices.sample_id);

      var chartsCount = 0;
      var groupAttrs = [];
      var group = {};
      var charts = {};
      var groups = [];

      // group.data = data_.groups.patient.data;
      group.type = 'patient';
      group.id = vm_.groupCount;

      $.each(data_.groups.patient.attr_meta,function(key,attrData){
        attrData.group_type = group.type;
        if(chartsCount<31){
          if(attrData.show){
            attrData.group_id = group.id;
            groupAttrs.push(attrData);
            chartsCount++;
          }
        }else{
          attrData.show = false;
        }
        charts[attrData.attr_id]=attrData;
      });
      group.attributes = groupAttrs;
      groups.push(group);
      group = {};

      chartsCount = 0;
      groupAttrs = [];
      group = {};
      vm_.groupCount = vm_.groupCount+1;
      //group.data = data_.groups.sample.data;
      group.type = 'sample';
      group.id = vm_.groupCount;

      $.each(data_.groups.sample.attr_meta,function(key,attrData){
        attrData.group_type = group.type;
        if(chartsCount<31){
          if(attrData.show){
            attrData.group_id = group.id;
            groupAttrs.push(attrData);
            chartsCount++;
          }
        }else{
          attrData.show = false;
        }
        charts[attrData.attr_id]=attrData;
      });
      vm_.groupCount = vm_.groupCount+1;
      group.attributes = groupAttrs;
      groups.push(group);



      vm_.isloading = false;
      vm_.selectedsamples = _sampleIds;
      vm_.selectedpatients = _patientIds;
      // vm_.patientmap = data_.groups.group_mapping.patient.sample;
      // vm_.samplemap = data_.groups.group_mapping.sample.patient;
      vm_.groups = groups;
      vm_.charts = charts;


    }, // ---- close init function ----groups
    getAttrData : function(type, attr){
      var _data = {};
      var toReturn_ = [];
      if(type === 'sample'){
        _data = data_.groups.sample.data;
      }else if(type === 'patient'){
        _data = data_.groups.patient.data;
      }
      if(attr !== undefined){
        $.each(_data,function(key,val){
          if(val[attr] !== undefined){
            toReturn_.push(val[attr]);
          }
        });
      }else{
        toReturn_ = _data
      }
      return toReturn_;
    },
    getCasesMap : function(type){
      if(type === 'sample'){
        return data_.groups.group_mapping.sample.patient;
      }else{
        return data_.groups.group_mapping.patient.sample;
      }
    },
    getCaseIndices : function(type){
      if(type === 'sample'){
        return data_.groups.sample.data_indices.sample_id;
      }else{
        return data_.groups.patient.data_indices.patient_id;
      }
    },
    stat: function () {
      var _result = {};
      _result['filters'] = {};

      // extract and reformat selected cases
      var _selectedCases = [];

      _.each(vm_.selectedsamples, function (_selectedSample) {

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
      _result.filters['patients'] = [];
      _result.filters['samples'] = [];
      _.each(vm_.groups, function (group) {
        if (group.type === 'patient') {
          var filters_ = []
          _.each(group.attributes, function (attributes) {
            if (attributes.filter.length > 0)
              filters_[attributes.attr_id] = attributes.filter;
          });
          var temp = $.extend(true, _result.filters['patients'], filters_);
          var array = $.extend(true, {}, temp)
          _result.filters['patients'] = array;
        } else if (group.type === 'sample') {
          var filters_ = []
          _.each(group.attributes, function (attributes) {
            if (attributes.filter.length > 0)
              filters_[attributes.attr_id] = attributes.filter;
          });
          var temp = $.extend(true, _result.filters['samples'], filters_);
          var array = $.extend(true, {}, temp)
          _result.filters['samples'] = array;
        }
      });
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
    applyVC: function (_vc) {
      var _selectedSamples = [], _selectedPatients = [];
      _.each(_.pluck(_vc.selectedCases, "samples"), function (_arr) {
        _selectedSamples = _selectedSamples.concat(_arr);
      });
      _.each(_.pluck(_vc.selectedCases, "patients"), function (_arr) {
        _selectedPatients = _selectedPatients.concat(_arr);
      });
      iViz.init(data_, _selectedSamples, _selectedPatients);
    },
    resetAll: function () {
      var _selectedStudyIds = []
      var _currentURL = window.location.href;
      if (_currentURL.indexOf("vc_id") !== -1 && _currentURL.indexOf("study_id") !== -1) {
        var _vcId;
        var query = location.search.substr(1);
        _.each(query.split('&'), function (_part) {
          var item = _part.split('=');
          if (item[0] === 'vc_id') {
            _vcId = item[1];
          } else if (item[0] === 'study_id') {
            _selectedStudyIds = _selectedStudyIds.concat(item[1].split(','));
          }
        });
        $.getJSON(URL + _vcId, function (response) {
          _selectedStudyIds = _selectedStudyIds.concat(_.pluck(response.data.virtualCohort.selectedCases, "studyID"));
          var _selectedPatientIds = [];
          _.each(_.pluck(response.data.virtualCohort.selectedCases, "patients"), function (_patientIds) {
            _selectedPatientIds = _selectedPatientIds.concat(_patientIds);
          });
          var _selectedSampleIds = [];
          _.each(_.pluck(response.data.virtualCohort.selectedCases, "samples"), function (_sampleIds) {
            _selectedSampleIds = _selectedSampleIds.concat(_sampleIds);
          });
          iViz.init(_selectedStudyIds, _selectedSampleIds, _selectedPatientIds);
        });
      } else if (_currentURL.indexOf("vc_id") === -1 && _currentURL.indexOf("study_id") !== -1) {
        _selectedStudyIds = _selectedStudyIds.concat(location.search.split('study_id=')[1].split(','));
        iViz.init(_selectedStudyIds);
      } else if (_currentURL.indexOf("vc_id") !== -1 && _currentURL.indexOf("study_id") === -1) {
        var _vcId = location.search.split('vc_id=')[1];
        $.getJSON(URL + _vcId, function (response) {
          _selectedStudyIds = _selectedStudyIds.concat(_.pluck(response.data.virtualCohort.selectedCases, "studyID"));
          var _selectedPatientIds = [];
          _.each(_.pluck(response.data.virtualCohort.selectedCases, "patients"), function (_patientIds) {
            _selectedPatientIds = _selectedPatientIds.concat(_patientIds);
          });
          var _selectedSampleIds = [];
          _.each(_.pluck(response.data.virtualCohort.selectedCases, "samples"), function (_sampleIds) {
            _selectedSampleIds = _selectedSampleIds.concat(_sampleIds);
          });
          iViz.init(_selectedStudyIds, _selectedSampleIds, _selectedPatientIds);
        });
      } else {
        iViz.vue.manage.getInstance().initialize();
        iViz.init(data_);
      }
    }
  }
}(window._, window.$));