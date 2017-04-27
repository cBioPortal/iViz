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
  var charts = {};
  var configs_ = {
    styles: {
      vars: {
        width: {
          one: 195,
          two: 400
        },
        height: {
          one: 170,
          two: 350
        },
        chartHeader: 17,
        borderWidth: 2,
        scatter: {
          width: 398,
          height: 331
        },
        survival: {
          width: 398,
          height: 331
        },
        specialTables: {
          width: 398,
          height: 306
        },
        piechart: {
          width: 140,
          height: 140
        },
        barchart: {
          width: 398,
          height: 134
        }
      }
    },
    numOfSurvivalCurveLimit: 20,
    dc: {
      transitionDuration: 400
    }
  };

  function getAttrVal(attrs, arr) {
    var str = [];
    _.each(attrs, function(displayName, attrId) {
      if (attrId === 'cna_details' || attrId === 'mutated_genes') {
        var temp = 'No';
        if (arr[attrId] !== undefined) {
          temp = arr[attrId].length > 0 ? 'Yes' : 'No';
        }
        str.push(temp);
      } else {
        str.push(arr[attrId] ? arr[attrId] : 'NA');
      }
    });
    return str;
  }

  return {

    init: function(_rawDataJSON, configs) {
      vm_ = iViz.vue.manage.getInstance();

      data_ = _rawDataJSON;

      if (_.isObject(configs)) {
        configs_ = $.extend(true, configs_, configs);
      }

      hasPatientAttrDataMap_ = data_.groups.patient.hasAttrData;
      hasSampleAttrDataMap_ = data_.groups.sample.hasAttrData;
      patientData_ = data_.groups.patient.data;
      sampleData_ = data_.groups.sample.data;

      var _patientIds = _.keys(data_.groups.patient.data_indices.patient_id);
      var _sampleIds = _.keys(data_.groups.sample.data_indices.sample_id);

      var chartsCount = 0;
      var patientChartsCount = 0;
      var groupAttrs = [];
      var group = {};
      var groups = [];

      // group.data = data_.groups.patient.data;
      group.type = 'patient';
      group.id = vm_.groupCount;
      group.selectedcases = [];
      group.hasfilters = false;
      _.each(data_.groups.patient.attr_meta, function(attrData) {
        attrData.group_type = group.type;
        if (chartsCount < 20 && patientChartsCount < 10) {
          if (attrData.show) {
            attrData.group_id = group.id;
            groupAttrs.push(attrData);
            chartsCount++;
            patientChartsCount++;
          }
        } else {
          attrData.show = false;
        }
        charts[attrData.attr_id] = attrData;
        if (attrData.view_type === 'survival' && attrData.show) {
          vm_.numOfSurvivalPlots++;
        }
      });
      group.attributes = groupAttrs;
      groups.push(group);

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
        if (chartsCount < 20) {
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
        vm_.$nextTick(function() {
          _self.fetchCompleteData('patient');
          _self.fetchCompleteData('sample');
        });
      });
    }, // ---- close init function ----groups
    createGroupNdx: function(group) {
      var def = new $.Deferred();
      var _caseAttrId = group.type === 'patient' ? 'patient_id' : 'sample_id';
      var _attrIds = [_caseAttrId, 'study_id'];
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
      _.each(attrIds, function(_attrId) {
        if (charts[_attrId] === undefined) {
          updatedAttrIds = updatedAttrIds.concat(_attrId);
        } else {
          updatedAttrIds = updatedAttrIds.concat(charts[_attrId].attrList);
        }
      });
      updatedAttrIds = iViz.util.unique(updatedAttrIds);
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
        $.when(this.updateDataObject(type, attrDataToGet))
          .then(function() {
            _def.resolve();
          }, function() {
            _def.reject();
          });
      } else {
        _def.resolve();
      }
      return def.promise();
    },
    fetchCompleteData: function(_type, _processData) {
      var _def = new $.Deferred();
      var _attrIds = _.pluck(_.filter(charts, function(_chart) {
        return _chart.group_type === _type;
      }), 'attr_id');
      if (_processData) {
        $.when(iViz.getDataWithAttrs(_type, _attrIds))
          .then(function() {
            _def.resolve();
          }, function() {
            _def.reject();
          });
      } else {
        $.when(window.iviz.datamanager.getClinicalData(_attrIds, (_type === 'patient')))
          .then(function() {
            _def.resolve();
          }, function() {
            _def.reject();
          });
      }
      return _def.promise();
    },
    updateDataObject: function(type, attrIds) {
      var def = new $.Deferred();
      var self_ = this;
      var isPatientAttributes = (type === 'patient');
      var _data = isPatientAttributes ? patientData_ : sampleData_;
      var hasAttrDataMap = isPatientAttributes ?
        hasPatientAttrDataMap_ : hasSampleAttrDataMap_;

      $.when(
        window.iviz.datamanager.getClinicalData(attrIds, isPatientAttributes))
        .then(function(clinicalData) {
          var _caseIdToClinDataMap = {};
          var idType = isPatientAttributes ? 'patient_id' : 'sample_id';
          _.each(clinicalData, function(_clinicalAttributeData, _attrId) {
            var selectedAttrMeta = charts[_attrId];

            hasAttrDataMap[_attrId] = '';
            selectedAttrMeta.keys = {};
            selectedAttrMeta.numOfDatum = 0;

            _.each(_clinicalAttributeData, function(_dataObj) {
              if (_caseIdToClinDataMap[_dataObj[idType]] === undefined) {
                _caseIdToClinDataMap[_dataObj[idType]] = {};
              }
              _caseIdToClinDataMap[_dataObj[idType]][_dataObj.attr_id] =
                _dataObj.attr_val;

              if (!selectedAttrMeta.keys
                  .hasOwnProperty(_dataObj.attr_val)) {
                selectedAttrMeta.keys[_dataObj.attr_val] = 0;
              }
              ++selectedAttrMeta.keys[_dataObj.attr_val];
              ++selectedAttrMeta.numOfDatum;
            });

            // if (selectedAttrMeta.datatype === 'STRING' &&
            //   Object.keys(selectedAttrMeta.keys).length > 20) {
            //   var caseIds = isPatientAttributes ?
            //     Object.keys(data_.groups.group_mapping.patient.sample) :
            //     Object.keys(data_.groups.group_mapping.sample.patient);
            //
            //   selectedAttrMeta.view_type = 'table';
            //   selectedAttrMeta.type = 'pieLabel';
            //   selectedAttrMeta.options = {
            //     allCases: caseIds,
            //     sequencedCases: caseIds
            //   };
            // }
          });
          var type = isPatientAttributes ? 'patient' : 'sample';
          var caseIndices = self_.getCaseIndices(type);
          _.each(_caseIdToClinDataMap, function(_clinicalData, _caseId) {
            var _caseIndex = caseIndices[_caseId];
            _.extend(_data[_caseIndex], _clinicalData);
          });

          def.resolve();
        }, function() {
          def.reject();
        });
      return def.promise();
    },
    extractMutationData: function(_mutationData) {
      var _mutGeneMeta = {};
      var _mutGeneMetaIndex = 0;
      var _sampleDataIndicesObj = this.getCaseIndices('sample');
      _.each(_mutationData, function(_mutGeneDataObj) {
        var _geneSymbol = _mutGeneDataObj.gene_symbol;
        var _uniqueId = _geneSymbol;
        _.each(_mutGeneDataObj.caseIds, function(_caseId) {
          if (_sampleDataIndicesObj[_caseId] !== undefined) {
            var _caseIdIndex = _sampleDataIndicesObj[_caseId];
            if (_mutGeneMeta[_uniqueId] === undefined) {
              _mutGeneMeta[_uniqueId] = {};
              _mutGeneMeta[_uniqueId].gene = _geneSymbol;
              _mutGeneMeta[_uniqueId].num_muts = 1;
              _mutGeneMeta[_uniqueId].caseIds = [_caseId];
              _mutGeneMeta[_uniqueId].qval = (window.iviz.datamanager.getCancerStudyIds().length === 1 && _mutGeneDataObj.hasOwnProperty('qval')) ? _mutGeneDataObj.qval : null;
              _mutGeneMeta[_uniqueId].index = _mutGeneMetaIndex;
              if (sampleData_[_caseIdIndex].mutated_genes === undefined) {
                sampleData_[_caseIdIndex].mutated_genes = [_mutGeneMetaIndex];
              } else {
                sampleData_[_caseIdIndex].mutated_genes.push(_mutGeneMetaIndex);
              }
              _mutGeneMetaIndex += 1;
            } else {
              _mutGeneMeta[_uniqueId].num_muts += 1;
              _mutGeneMeta[_uniqueId].caseIds.push(_caseId);
              if (sampleData_[_caseIdIndex].mutated_genes === undefined) {
                sampleData_[_caseIdIndex].mutated_genes = [_mutGeneMeta[_uniqueId].index];
              } else {
                sampleData_[_caseIdIndex].mutated_genes.push(_mutGeneMeta[_uniqueId].index);
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
        var _uniqueId = _geneSymbol + '-' + _altType;
        _.each(_caseIdsPerGene, function(_caseId) {
          if (_sampleDataIndicesObj[_caseId] !== undefined) {
            var _caseIdIndex = _sampleDataIndicesObj[_caseId];
            if (_cnaMeta[_uniqueId] === undefined) {
              _cnaMeta[_uniqueId] = {};
              _cnaMeta[_uniqueId].gene = _geneSymbol;
              _cnaMeta[_uniqueId].cna = _altType;
              _cnaMeta[_uniqueId].cytoband = _cnaData.cytoband[_index];
              _cnaMeta[_uniqueId].caseIds = [_caseId];
              if ((window.iviz.datamanager.getCancerStudyIds().length !== 1) || _cnaData.gistic[_index] === null) {
                _cnaMeta[_uniqueId].qval = null;
              } else {
                _cnaMeta[_uniqueId].qval = _cnaData.gistic[_index][0];
              }
              _cnaMeta[_uniqueId].index = _cnaMetaIndex;
              if (sampleData_[_caseIdIndex].cna_details === undefined) {
                sampleData_[_caseIdIndex].cna_details = [_cnaMetaIndex];
              } else {
                sampleData_[_caseIdIndex].cna_details.push(_cnaMetaIndex);
              }
              _cnaMetaIndex += 1;
            } else {
              _cnaMeta[_uniqueId].caseIds.push(_caseId);
              if (sampleData_[_caseIdIndex].cna_details === undefined) {
                sampleData_[_caseIdIndex].cna_details = [_cnaMeta[_uniqueId].index];
              } else {
                sampleData_[_caseIdIndex].cna_details.push(_cnaMeta[_uniqueId].index);
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
          $.when(window.iviz.datamanager.getMutData())
            .then(function(_data) {
              def.resolve(self.extractMutationData(_data));
            }, function() {
              def.reject();
            });
        } else if (attrId === 'cna_details') {
          $.when(window.iviz.datamanager.getCnaData())
            .then(function(_data) {
              def.resolve(self.extractCnaData(_data));
            }, function() {
              def.reject();
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
    getPatientIds: function(sampleId) {
      var map = this.getCasesMap('sample');
      return map[sampleId];
    },
    getSampleIds: function(patientId) {
      var map = this.getCasesMap('patient');
      return map[patientId];
    },
    openCases: function(type) {
      if (type !== 'patient') {
        type = 'sample';
      }

      var studyId = '';
      var possible = true;
      var selectedCases_ = [];
      var caseIndices_ = {};
      var dataRef = [];

      if (type === 'patient') {
        selectedCases_ = vm_.selectedpatients;
        caseIndices_ = this.getCaseIndices('patient');
        dataRef = patientData_;
      } else {
        selectedCases_ = vm_.selectedsamples;
        caseIndices_ = this.getCaseIndices('sample');
        dataRef = sampleData_;
      }

      $.each(selectedCases_, function(key, caseId) {
        if (key === 0) {
          studyId = dataRef[caseIndices_[caseId]].study_id;
        } else if (studyId !== dataRef[caseIndices_[caseId]].study_id) {
          possible = false;
          return false;
        }
      });
      if (possible) {
        var _selectedCaseIds = selectedCases_.sort();
        var _url = window.cbioURL + 'case.do?cancer_study_id=' +
          studyId + '&' + (type === 'patient' ? 'case_id' : 'sample_id') +
          '=' + _selectedCaseIds[0] +
          '#nav_case_ids=' + _selectedCaseIds.join(',');
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
      $.when(this.fetchCompleteData('patient', true), this.fetchCompleteData('sample', true)).then(function() {
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
          strA = getAttrVal(attr, arr[i]);
          content += '\r\n' + strA.join('\t');
        }

        var downloadOpts = {
          filename: 'study_view_clinical_data.txt',
          contentType: 'text/plain;charset=utf-8',
          preProcess: false
        };

        cbio.download.initDownload(content, downloadOpts);
      }, function() {
        // TODO: give warning/error message to user if the download is failed
      });
    },
    submitForm: function() {
      var selectedCases_ = vm_.selectedsamples;
      var studyId_ = '';
      var possibleTOQuery = true;

      // Remove all hidden inputs
      $('#iviz-form input:not(:first)').remove();

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
        window.studyId = studyId_;
        if (QueryByGeneTextArea.isEmpty()) {
          QueryByGeneUtil.toMainPage(studyId_, selectedCases_);
        } else {
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
        QueryByGeneUtil.toQueryPage(window.studyId, vm_.selectedsamples,
          QueryByGeneTextArea.getGenes(), window.mutationProfileId,
          window.cnaProfileId);
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
          _selectedCases.push({
            studyID: _studyId,
            samples: [_selectedSample]
          });
        } else {
          _.each(_selectedCases, function(_resultObj) {
            if (_resultObj.studyID === _studyId) {
              _resultObj.samples.push(_selectedSample);
            }
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
      _result.selectedCases = _selectedCases;
      return _result;
    },

    vm: function() {
      return vm_;
    },
    view: {
      component: {}
    },
    util: {},
    opts: configs_,
    data: {},
    styles: configs_.styles,
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
