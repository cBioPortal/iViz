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
  var tableData_ = [];
  var groupFiltersMap_ = {};
  var groupNdxMap_ = {};
  var hasSampleAttrDataMap_ = {};
  var hasPatientAttrDataMap_ = {};
  var patientData_;
  var sampleData_;

  return {

    init: function(_rawDataJSON) {
      vm_ = iViz.vue.manage.getInstance();

      data_ = _rawDataJSON;

      hasPatientAttrDataMap_ = data_.groups.patient.hasAttrData;
      hasSampleAttrDataMap_ = data_.groups.sample.hasAttrData;
      patientData_ = data_.groups.patient.data;
      sampleData_ = data_.groups.sample.data;

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
      var _self = this;
      var requests = groups.map(function(group) {
        var _def = new $.Deferred();
        _self.createGroupNdx(group).then(function() {
          _def.resolve();
        }).fail(function() {
          _def.reject();
        });
        return _def.promise();
      });
      $.when.apply($, requests).then(function() {
        vm_.isloading = false;
        vm_.selectedsamples = _sampleIds;
        vm_.selectedpatients = _patientIds;
        // vm_.patientmap = data_.groups.group_mapping.patient.sample;
        // vm_.samplemap = data_.groups.group_mapping.sample.patient;
        vm_.groups = groups;
        vm_.charts = charts;
      });
    }, // ---- close init function ----groups
    createGroupNdx: function(group) {
      var def = new $.Deferred();
      var _caseAttrId = group.type === 'patient' ? 'patient_id' : 'sample_id';
      var _attrIds = [_caseAttrId];
      _attrIds = _attrIds.concat(_.pluck(group.attributes, 'attr_id'));
      $.when(iViz.getDataWithAttrs(group.type, _attrIds)).then(function(selectedData_) {
        groupNdxMap_[group.id] = {};
        groupNdxMap_[group.id].type = group.type;
        groupNdxMap_[group.id].data = selectedData_;
        groupNdxMap_[group.id].attributes = _attrIds;
        def.resolve();
      });
      return def.promise();
    },
    updateGroupNdx: function(groupId, attrId) {
      var def = new $.Deferred();
      var groupNdxData_ = groupNdxMap_[groupId];
      var attrIds = groupNdxData_.attributes;
      if (attrIds.indexOf(attrId) > -1) {
        def.resolve(false);
      } else {
        attrIds.push(attrId);
        $.when(iViz.getDataWithAttrs(groupNdxData_.type, attrIds)).then(function(selectedData_) {
          groupNdxData_.data = selectedData_;
          def.resolve(true);
        });
      }
      return def.promise();
    },
    getGroupNdx: function(groupId) {
      return groupNdxMap_[groupId].data;
    },
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
    },
    deleteGroupFilteredCases: function(groupId_) {
      groupFiltersMap_[groupId_] = undefined;
    },
    getDataWithAttrs: function(type, attrIds) {
      var def = new $.Deferred();
      var isPatientAttributes = (type === 'patient');
      var hasAttrDataMap = isPatientAttributes ? hasPatientAttrDataMap_ : hasSampleAttrDataMap_;
      var attrDataToGet = [];
      var updatedAttrIds = [];
      // TODO: Right now not all chart attribute id are mapped to clinical
      // attribute id or there might be a case where chart attribute id is
      // mapped to more than one clinical attribute id. Ex. for OS survial
      // curve we need both OS_STATUS and OS_MONTHS data. In future if we
      // need to update the logic over here if we are going to add any such
      // special charts
      _.each(attrIds, function(_attrId) {
        if (_attrId === 'MUT_CNT_VS_CNA') {
          updatedAttrIds.push('cna_fraction');
        } else if (_attrId === 'DFS_SURVIVAL') {
          updatedAttrIds.push('DFS_STATUS');
          updatedAttrIds.push('DFS_MONTHS');
        } else if (_attrId === 'OS_SURVIVAL') {
          updatedAttrIds.push('OS_STATUS');
          updatedAttrIds.push('OS_MONTHS');
        } else {
          updatedAttrIds.push(_attrId);
        }
      });

      _.each(updatedAttrIds, function(attrId) {
        if (hasAttrDataMap[attrId] === undefined) {
          attrDataToGet.push(attrId);
        }
      });
      var _def = new $.Deferred();
      $.when(_def).done(function() {
        var _data = isPatientAttributes ? patientData_ : sampleData_;
        var toReturn = [];
        _.each(_data, function(_caseData, _index) {
          toReturn[_index] = _.pick(_caseData, updatedAttrIds);
        });
        def.resolve(toReturn);
      });
      if (attrDataToGet.length > 0) {
        $.when(this.updateDataObject(type, attrDataToGet)).then(function() {
          _def.resolve();
        });
      } else {
        _def.resolve();
      }
      return def.promise();
    },
    updateDataObject: function(type, attrIds) {
      var def = new $.Deferred();
      var self_ = this;
      var isPatientAttributes = (type === 'patient');
      var _data = isPatientAttributes ? patientData_ : sampleData_;
      var hasAttrDataMap = isPatientAttributes ? hasPatientAttrDataMap_ : hasSampleAttrDataMap_;

      $.when(window.iviz.datamanager.getClinicalData(attrIds, isPatientAttributes)).then(function(clinicalData) {
        var _caseIdToClinDataMap = {};
        var idType = isPatientAttributes ? 'patient_id' : 'sample_id';
        _.each(clinicalData, function(_clinicalAttributeData, _attrId) {
          hasAttrDataMap[_attrId] = '';
          _.each(_clinicalAttributeData, function(_dataObj) {
            if (_caseIdToClinDataMap[_dataObj[idType]] === undefined) {
              _caseIdToClinDataMap[_dataObj[idType]] = {};
            }
            _caseIdToClinDataMap[_dataObj[idType]][_dataObj.attr_id] = _dataObj.attr_val;
          });
        });
        var type = isPatientAttributes ? 'patient' : 'sample';
        var caseIndices = self_.getCaseIndices(type);
        _.each(_caseIdToClinDataMap, function(_clinicalData, _caseId) {
          var _caseIndex = caseIndices[_caseId];
          _.extend(_data[_caseIndex], _clinicalData);
        });
        def.resolve();
      });
      return def.promise();
    },
    extractMutationData: function(_mutationData) {
      var _mutGeneMeta = {};
      var _mutGeneMetaIndex = 0;
      var _sampleDataIndicesObj = this.getCaseIndices('sample');
      _.each(_mutationData, function(_mutGeneDataObj) {
        var _geneSymbol = _mutGeneDataObj.gene_symbol;
        _.each(_mutGeneDataObj.caseIds, function(_caseId) {
          if (_sampleDataIndicesObj[_caseId] !== undefined) {
            var _caseIdIndex = _sampleDataIndicesObj[_caseId];
            if (_mutGeneMeta[_geneSymbol] === undefined) {
              _mutGeneMeta[_geneSymbol] = {};
              _mutGeneMeta[_geneSymbol].gene = _geneSymbol;
              _mutGeneMeta[_geneSymbol].num_muts = 1;
              _mutGeneMeta[_geneSymbol].caseIds = [_caseId];
              _mutGeneMeta[_geneSymbol].qval = (window.iviz.datamanager.getCancerStudyIds().length === 1 && _mutGeneDataObj.hasOwnProperty('qval')) ? _mutGeneDataObj.qval : null;
              _mutGeneMeta[_geneSymbol].index = _mutGeneMetaIndex;
              if (sampleData_[_caseIdIndex].mutated_genes === undefined) {
                sampleData_[_caseIdIndex].mutated_genes = [_mutGeneMetaIndex];
              } else {
                sampleData_[_caseIdIndex].mutated_genes.push(_mutGeneMetaIndex);
              }
              _mutGeneMetaIndex += 1;
            } else {
              _mutGeneMeta[_geneSymbol].num_muts += 1;
              _mutGeneMeta[_geneSymbol].caseIds.push(_caseId);
              if (sampleData_[_caseIdIndex].mutated_genes === undefined) {
                sampleData_[_caseIdIndex].mutated_genes = [_mutGeneMeta[_geneSymbol].index];
              } else {
                sampleData_[_caseIdIndex].mutated_genes.push(_mutGeneMeta[_geneSymbol].index);
              }
            }
          }
        });
      });
      tableData_.mutated_genes = {};
      tableData_.mutated_genes.geneMeta = _mutGeneMeta;
      return tableData_.mutated_genes;
    },
    extractCnaData: function(_cnaData) {
      var _cnaMeta = {};
      var _cnaMetaIndex = 0;
      var _sampleDataIndicesObj = this.getCaseIndices('sample');
      $.each(_cnaData.caseIds, function(_index, _caseIdsPerGene) {
        var _geneSymbol = _cnaData.gene[_index];
        _.each(_caseIdsPerGene, function(_caseId) {
          if (_sampleDataIndicesObj[_caseId] !== undefined) {
            var _caseIdIndex = _sampleDataIndicesObj[_caseId];
            if (_cnaMeta[_geneSymbol] === undefined) {
              _cnaMeta[_geneSymbol] = {};
              _cnaMeta[_geneSymbol].gene = _geneSymbol;
              var _altType = '';
              switch (_cnaData.alter[_index]) {
                case -2:
                  _altType = 'DEL';
                  break;
                case 2:
                  _altType = 'AMP';
                  break;
                default:
                  break;
              }
              _cnaMeta[_geneSymbol].cna = _altType;
              _cnaMeta[_geneSymbol].cytoband = _cnaData.cytoband[_index];
              _cnaMeta[_geneSymbol].caseIds = [_caseId];
              if ((window.iviz.datamanager.getCancerStudyIds().length !== 1) || _cnaData.gistic[_index] === null) {
                _cnaMeta[_geneSymbol].qval = null;
              } else {
                _cnaMeta[_geneSymbol].qval = _cnaData.gistic[_index][0];
              }
              _cnaMeta[_geneSymbol].index = _cnaMetaIndex;
              if (sampleData_[_caseIdIndex].cna_details === undefined) {
                sampleData_[_caseIdIndex].cna_details = [_cnaMetaIndex];
              } else {
                sampleData_[_caseIdIndex].cna_details.push(_cnaMetaIndex);
              }
              _cnaMetaIndex += 1;
            } else {
              _cnaMeta[_geneSymbol].caseIds.push(_caseId);
              if (sampleData_[_caseIdIndex].cna_details === undefined) {
                sampleData_[_caseIdIndex].cna_details = [_cnaMeta[_geneSymbol].index];
              } else {
                sampleData_[_caseIdIndex].cna_details.push(_cnaMeta[_geneSymbol].index);
              }
            }
          }
        });
      });
      tableData_.cna_details = {};
      tableData_.cna_details.geneMeta = _cnaMeta;
      return tableData_.cna_details;
    },
    getTableData: function(attrId) {
      var def = new $.Deferred();
      var self = this;
      if (tableData_[attrId] === undefined) {
        if (attrId === 'mutated_genes') {
          $.when(window.iviz.datamanager.getMutData()).then(function(_data) {
            def.resolve(self.extractMutationData(_data));
          });
        } else if (attrId === 'cna_details') {
          $.when(window.iviz.datamanager.getCnaData()).then(function(_data) {
            def.resolve(self.extractCnaData(_data));
          });
        }
      } else {
        def.resolve(tableData_[attrId]);
      }
      return def.promise();
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
      var content = strA.join('\t');
      strA.length = 0;
      var sampleIndices_ = data_.groups.sample.data_indices.sample_id;
      var patienIndices_ = data_.groups.patient.data_indices.patient_id;
      var samplePatientMapping = data_.groups.group_mapping.sample.patient;
      _.each(sampleIds_, function(sampleId) {
        var temp = sampleData_[sampleIndices_[sampleId]];
        var temp1 = $.extend(true, temp,
          patientData_[patienIndices_[samplePatientMapping[sampleId][0]]]);
        arr.push(temp1);
      });

      var arrL = arr.length;

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
      component: {}
    },
    util: {},
    opts: {
      dc: {
        transitionDuration: 400
      }
    },
    data: {},
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
