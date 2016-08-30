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

'use strict';
var iViz = (function(_, $, cbio, QueryByGeneUtil, QueryByGeneTextArea) {
  var data_;
  var vm_;
  var grid_;
  var tableData_ = [];
  var groupFiltersMap_ = {};

  return {

    init: function(_rawDataJSON) {
      vm_ = iViz.vue.manage.getInstance();

      data_ = _rawDataJSON;

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
      group.selectedcases = [];
      group.hasfilters = false;
      _.each(data_.groups.patient.attr_meta, function(attrData) {
        attrData.group_type = group.type;
        if (attrData.view_type === 'table') {
          tableData_[attrData.attr_id] = attrData.gene_list;
          attrData.gene_list = undefined;
        }
        if (chartsCount < 31) {
          if (attrData.show) {
            attrData.group_id = group.id;
            groupAttrs.push(attrData);
            chartsCount++;
          }
        } else {
          attrData.show = false;
        }
        charts[attrData.attr_id] = attrData;
      });
      group.attributes = groupAttrs;
      groups.push(group);

      chartsCount = 0;
      groupAttrs = [];
      group = {};
      vm_.groupCount += 1;
      // group.data = data_.groups.sample.data;
      group.type = 'sample';
      group.id = vm_.groupCount;
      group.selectedcases = [];
      group.hasfilters = false;
      _.each(data_.groups.sample.attr_meta, function(attrData) {
        attrData.group_type = group.type;
        if (attrData.view_type === 'table') {
          tableData_[attrData.attr_id] = attrData.gene_list;
          attrData.gene_list = undefined;
        }
        if (chartsCount < 31) {
          if (attrData.show) {
            attrData.group_id = group.id;
            groupAttrs.push(attrData);
            chartsCount++;
          }
        } else {
          attrData.show = false;
        }
        charts[attrData.attr_id] = attrData;
      });
      vm_.groupCount += 1;
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
    setGroupFilteredCases: function(groupId_, type_, filters_) {
      groupFiltersMap_[groupId_] = {};
      groupFiltersMap_[groupId_].type = type_;
      groupFiltersMap_[groupId_].cases = filters_;
    },
    getGroupFilteredCases: function(groupId_) {
      if (groupId_ !== undefined) {
        return groupFiltersMap_[groupId_];
      }
      return groupFiltersMap_;
    }, deleteGroupFilteredCases: function(groupId_) {
      groupFiltersMap_[groupId_] = undefined;
    },
    getAttrData: function(type, attr) {
      var _data = {};
      var toReturn_ = [];
      if (type === 'sample') {
        _data = data_.groups.sample.data;
      } else if (type === 'patient') {
        _data = data_.groups.patient.data;
      }
      if (attr === undefined) {
        toReturn_ = _data;
      } else {
        _.each(_data, function(val) {
          if (val[attr] !== undefined) {
            toReturn_.push(val[attr]);
          }
        });
      }
      return toReturn_;
    },
    getTableData: function(attrId) {
      return tableData_[attrId];
    },
    getCompleteData: function() {
      return data_;
    },
    getCasesMap: function(type) {
      if (type === 'sample') {
        return data_.groups.group_mapping.sample.patient;
      }
      return data_.groups.group_mapping.patient.sample;
    },
    getCaseIndices: function(type) {
      if (type === 'sample') {
        return data_.groups.sample.data_indices.sample_id;
      }
      return data_.groups.patient.data_indices.patient_id;
    },
    openCases: function() {
      var studyId = '';
      var possible = true;
      var selectedCases_ = vm_.selectedpatients;
      var caseIndices_ = this.getCaseIndices('patient');
      var patientData_ = data_.groups.patient.data;

      $.each(selectedCases_, function(key, caseId) {
        if (key === 0) {
          studyId = patientData_[caseIndices_[caseId]].study_id;
        } else if (studyId !== patientData_[caseIndices_[caseId]].study_id) {
          possible = false;
          return false;
        }
      });
      if (possible) {
        var _selectedPatientIds = selectedCases_.sort();
        var _url = window.cbioURL + '/case.do?cancer_study_id=' +
          studyId +
          '&case_id=' + _selectedPatientIds[0] +
          '#nav_case_ids=' + _selectedPatientIds.join(',');
        window.open(_url);
      } else {
        new Notification().createNotification(
          'This feature is not available to multiple studies for now!',
          {message_type: 'info'});
      }
    },
    downloadCaseData: function() {
      var content = '';
      var sampleIds_ = vm_.selectedsamples;
      var attr = {};

      attr.CANCER_TYPE_DETAILED = 'Cancer Type Detailed';
      attr.CANCER_TYPE = 'Cancer Type';
      attr.study_id = 'Study ID';
      attr.patient_id = 'Patient ID';
      attr.sample_id = 'Sample ID';
      attr.mutated_genes = 'With Mutation Data';
      attr.cna_details = 'With CNA Data';

      var arr = [];
      var arrL = 0;
      var strA = [];

      var sampleAttr_ = data_.groups.sample.attr_meta;
      var patientAttr_ = data_.groups.patient.attr_meta;

      _.each(sampleAttr_, function(_attr) {
        if (attr[_attr.attr_id] === undefined &&
          _attr.view_type !== 'scatter_plot') {
          attr[_attr.attr_id] = _attr.display_name;
        }
      });

      _.each(patientAttr_, function(_attr) {
        if (attr[_attr.attr_id] === undefined &&
          _attr.view_type !== 'survival') {
          attr[_attr.attr_id] = _attr.display_name;
        }
      });

      _.each(attr, function(displayName) {
        strA.push(displayName || 'Unknown');
      });
      content = strA.join('\t');
      strA.length = 0;
      var sampleIndices_ = data_.groups.sample.data_indices.sample_id;
      var patienIndices_ = data_.groups.patient.data_indices.patient_id;
      var sampleData_ = data_.groups.sample.data;
      var patientData_ = data_.groups.patient.data;
      var samplePatientMapping = data_.groups.group_mapping.sample.patient;
      _.each(sampleIds_, function(sampleId) {
        var temp = sampleData_[sampleIndices_[sampleId]];
        var temp1 = $.extend(true, temp,
          patientData_[patienIndices_[samplePatientMapping[sampleId][0]]]);
        arr.push(temp1);
      });

      arrL = arr.length;

      for (var i = 0; i < arrL; i++) {
        strA.length = 0;
        _.each(attr, function(displayName, attrId) {
          if (attrId === 'cna_details' || attrId === 'mutated_genes') {
            var temp = 'No';
            if (arr[i][attrId] !== undefined) {
              temp = arr[i][attrId].length > 0 ? 'Yes' : 'No';
            }
            strA.push(temp);
          } else {
            strA.push(arr[i][attrId]);
          }
        });
        content += '\r\n' + strA.join('\t');
      }

      var downloadOpts = {
        filename: 'study_view_clinical_data.txt',
        contentType: 'text/plain;charset=utf-8',
        preProcess: false
      };

      cbio.download.initDownload(content, downloadOpts);
    },
    submitForm: function() {
      var selectedCases_ = vm_.selectedsamples;
      var studyId_ = '';
      var possibleTOQuery = true;
      _.each(selectedCases_, function(_caseId, key) {
        var index_ = data_.groups.sample.data_indices.sample_id[_caseId];
        if (key === 0) {
          studyId_ = data_.groups.sample.data[index_].study_id;
        } else if (studyId_ !== data_.groups.sample.data[index_].study_id) {
          possibleTOQuery = false;
          return false;
        }
      });
      if (possibleTOQuery) {
        $('#iviz-form').get(0).setAttribute(
          'action', window.cbioURL + '/index.do');
        $('<input>').attr({
          type: 'hidden',
          value: studyId_,
          name: 'cancer_study_id'
        }).appendTo('#iviz-form');

        $('<input>').attr({
          type: 'hidden',
          value: window.case_set_id,
          name: 'case_set_id'
        }).appendTo('#iviz-form');

        $('<input>').attr({
          type: 'hidden',
          value: selectedCases_.join(' '),
          name: 'case_ids'
        }).appendTo('#iviz-form');

        window.studyId = studyId_;
        if (QueryByGeneTextArea.isEmpty()) {
          $('#iviz-form').trigger('submit');
        } else {
          event.preventDefault();
          QueryByGeneTextArea.validateGenes(this.decideSubmit, false);
        }
      } else {
        new Notification().createNotification(
          'Querying multiple studies features is not yet ready!',
          {message_type: 'info'});
      }
    },
    decideSubmit: function(allValid) {
      // if all genes are valid, submit, otherwise show a notification
      if (allValid) {
        new QueryByGeneUtil().addStudyViewFields(
          window.studyId, window.mutationProfileId, window.cnaProfileId);
        $('#iviz-form').trigger('submit');
      } else {
        new Notification().createNotification(
          'There were problems with the selected genes. Please fix.',
          {message_type: 'danger'});
        $('#query-by-gene-textarea').focus();
      }
    },
    stat: function() {
      var _result = {};
      _result.filters = {};

      // extract and reformat selected cases
      var _selectedCases = [];

      _.each(vm_.selectedsamples, function(_selectedSample) {
        var _index = data_.groups.sample
          .data_indices.sample_id[_selectedSample];
        var _studyId = data_.groups.sample.data[_index].study_id;

        // extract study information
        if ($.inArray(_studyId, _.pluck(_selectedCases, 'studyID')) === -1) {
          _.each(_selectedCases, function(_resultObj) {
            if (_resultObj.studyID === _studyId) {
              _resultObj.samples.push(_selectedSample);
            }
          });
        } else {
          _selectedCases.push({
            studyID: _studyId,
            samples: [_selectedSample]
          });
        }

        // map samples to patients
        _.each(_selectedCases, function(_resultObj) {
          _resultObj.patients = iViz.util.idMapping(
            data_.groups.group_mapping.sample.patient, _resultObj.samples);
        });
      });
      _result.filterspatients = [];
      _result.filters.samples = [];
      _.each(vm_.groups, function(group) {
        var filters_ = [];
        var temp;
        var array;

        if (group.type === 'patient') {
          _.each(group.attributes, function(attributes) {
            if (attributes.filter.length > 0) {
              filters_[attributes.attr_id] = attributes.filter;
            }
          });
          temp = $.extend(true, _result.filters.patients, filters_);
          array = $.extend(true, {}, temp);
          _result.filters.patients = array;
        } else if (group.type === 'sample') {
          _.each(group.attributes, function(attributes) {
            if (attributes.filter.length > 0) {
              filters_[attributes.attr_id] = attributes.filter;
            }
          });
          temp = $.extend(true, _result.filters.samples, filters_);
          array = $.extend(true, {}, temp);
          _result.filters.samples = array;
        }
      });
      _result.selected_cases = _selectedCases;
      return _result;
    },

    vm: function() {
      return vm_;
    },
    view: {
      component: {},
      grid: {
        get: function() {
          return grid_;
        },
        layout: function() {
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
    applyVC: function(_vc) {
      var _selectedSamples = [];
      var _selectedPatients = [];
      _.each(_.pluck(_vc.selectedCases, 'samples'), function(_arr) {
        _selectedSamples = _selectedSamples.concat(_arr);
      });
      _.each(_.pluck(_vc.selectedCases, 'patients'), function(_arr) {
        _selectedPatients = _selectedPatients.concat(_arr);
      });
      iViz.init(data_, _selectedSamples, _selectedPatients);
    }
  };
})(window._,
  window.$,
  window.cbio,
  window.QueryByGeneUtil,
  window.QueryByGeneTextArea);
