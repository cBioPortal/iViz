'use strict';
window.iViz = (function(_, $, cbio, QueryByGeneUtil, QueryByGeneTextArea) {
  var data_;
  var vm_;
  var tableData_ = [];
  var groupFiltersMap_ = {};
  var groupNdxMap_ = {};
  var charts = {};
  var includeCases= true;
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
    }
  };
  var URLlenLimit = 1800;

  function getNavCaseIdsStr(selectedCasesMap, selectedCaseIds, underURLLimit) {
    var result = {
      str: '',
      limit: -1
    };
    var targetList = selectedCaseIds;
    if (Object.keys(selectedCasesMap).length > 1) {
      targetList = [];
      _.each(selectedCasesMap, function(patientIds, studyId) {
        _.each(patientIds, function(patientId, index) {
          targetList.push(studyId + ":" + patientId);
        });
      });
    }
    if (underURLLimit) {
      _.every(targetList, function(id, index) {
        if (index === 0) {
          result.str = id;
          return true;
        }
        var _str = result.str += ',' + id;
        if (_str.length > URLlenLimit) {
          result.limit = index;
          return false;
        } else {
          result.str = _str;
          return true;
        }
      })
    } else {
      result.str = targetList.join(',');
    }

    return result;
  }

  return {

    init: function(_rawDataJSON, configs,_selectableIds) {
      vm_ = iViz.vue.manage.getInstance();
      var selectableIdsSet = {}
      _.each(_selectableIds, function(id){
        selectableIdsSet[id] = true;
      });

      var cohortIds = window.cohortIdsList;
      for (var i = 0; i < cohortIds.length; i++) {
        if(selectableIdsSet[cohortIds[i]]){
          includeCases = false;
          break;
        }
      }

      data_ = _rawDataJSON;

      if (_.isObject(configs)) {
        configs_ = $.extend(true, configs_, configs);
      }

      var chartsCount = 0;
      var patientGroupAttrs = [];
      var sampleGroupAttrs = [];
      var groups = [];

      _.each(data_.groups.patient.attr_meta, function(attrData) {
        attrData.group_type = 'patient';
        charts[attrData.attr_id] = attrData;
        if (attrData.view_type === 'survival' && attrData.show) {
          vm_.numOfSurvivalPlots++;
        }
      });
      _.each(data_.groups.sample.attr_meta, function(attrData) {
        attrData.group_type = 'sample';
        charts[attrData.attr_id] = attrData;
      });

      _.each(iviz.datamanager.sortByNumOfStudies(
        data_.groups.patient.attr_meta.concat(data_.groups.sample.attr_meta))
        , function(attrData) {
          if (chartsCount < iViz.opts.numOfChartsLimit) {
            if (attrData.show) {
              if (attrData.group_type === 'patient') {
                patientGroupAttrs.push(attrData);
              } else {
                sampleGroupAttrs.push(attrData);
              }
              chartsCount++;
            }
          } else {
            attrData.show = false;
          }
        });
      groups.push({
        type: 'patient',
        id: vm_.groupCount.toString(),
        selectedcases: [],
        hasfilters: false,
        attributes: _.map(patientGroupAttrs, function(attr) {
          attr.group_id = vm_.groupCount.toString();
          return attr;
        })
      });
      vm_.groupCount += 1;

      groups.push({
        type: 'sample',
        id: vm_.groupCount.toString(),
        selectedcases: [],
        hasfilters: false,
        attributes: _.map(sampleGroupAttrs, function(attr) {
          attr.group_id = vm_.groupCount.toString();
          return attr;
        })
      });
      vm_.groupCount += 1;

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
        vm_.selectedsampleUIDs = _.pluck(data_.groups.sample.data, 'sample_uid');
        vm_.selectedpatientUIDs = _.pluck(data_.groups.patient.data, 'patient_uid');
        vm_.groups = groups;
        vm_.charts = charts;

        //Show unknown samples error message, whenthe initial(pie and bar) charts are loaded
        if (window.iviz.datamanager.unknownSamples.length > 0) {
          var str = ''
          window.iviz.datamanager.unknownSamples.forEach(function(obj){
            obj.samples.forEach(function(sample){
              str = str+'<br/>'+obj.studyId+':'+sample
            })
          })
          new Notification().createNotification('Following sample(s) might have been deleted/updated with the recent data updates<br/>'+str, {
            message_type: 'danger',
            delay:10000
          });
        }
      });
    }, // ---- close init function ----groups
    createGroupNdx: function(group) {
      var def = new $.Deferred();
      var _caseAttrId = group.type === 'patient' ? 'patient_uid' : 'sample_uid';
      if (_caseAttrId === 'sample_uid') {
        //add 'sample_id' to get mutation count and cna fraction for scatter plot
        var _attrIds = [_caseAttrId, 'sample_id', 'study_id'];
      } else {
        var _attrIds = [_caseAttrId, 'study_id'];
      }
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
      var hasAttrDataMap = isPatientAttributes ? data_.groups.patient.has_attr_data : data_.groups.sample.has_attr_data;
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
        var _data = isPatientAttributes ? data_.groups.patient.data : data_.groups.sample.data;
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
      var _data = isPatientAttributes ? data_.groups.patient.data : data_.groups.sample.data;
      var hasAttrDataMap = isPatientAttributes ?
        data_.groups.patient.has_attr_data : data_.groups.sample.has_attr_data;

      $.when(
        window.iviz.datamanager.getClinicalData(attrIds, isPatientAttributes))
        .then(function(clinicalData) {
          iViz.vue.manage.getInstance().increaseStudyViewSummaryPagePBStatus();
          var idType = isPatientAttributes ? 'patient_id' : 'sample_id';
          var type = isPatientAttributes ? 'patient' : 'sample';
          var attrsFromServer = {};
          _.each(clinicalData, function(_clinicalAttributeData, _attrId) {
            var selectedAttrMeta = charts[_attrId];

            hasAttrDataMap[_attrId] = '';
            selectedAttrMeta.keys = {};
            selectedAttrMeta.numOfDatum = 0;

            _.each(_clinicalAttributeData, function(_dataObj) {
              var caseIndex = self_.getCaseIndex(type, _dataObj.study_id, _dataObj[idType]);

              // Filter 'undefined' case index		
              if (caseIndex !== undefined) {
                _data[caseIndex] = _data[caseIndex] || {};
                _data[caseIndex][_dataObj.attr_id] = _dataObj.attr_val;
              }

              if (!selectedAttrMeta.keys
                  .hasOwnProperty(_dataObj.attr_val)) {
                selectedAttrMeta.keys[_dataObj.attr_val] = 0;
              }
              ++selectedAttrMeta.keys[_dataObj.attr_val];
              ++selectedAttrMeta.numOfDatum;
            });

            // Hide chart which only has no more than one category.
            var numOfKeys = Object.keys(selectedAttrMeta.keys).length;
            if (numOfKeys <= 1
              && ['CANCER_TYPE', 'CANCER_TYPE_DETAILED'].indexOf(_attrId) === -1) {
              selectedAttrMeta.show = false;
              attrIds = attrIds.filter(function(obj) {
                return obj !== _attrId;
              });
            } else {
              // If there is clinical data returned from server side.
              attrsFromServer[_attrId] = 1;
            }

            if (selectedAttrMeta.datatype === 'STRING' &&
              numOfKeys > iViz.opts.pie2TableLimit) {
              // Change pie chart to table if the number of categories
              // more then the pie2TableLimit configuration
              var uids = isPatientAttributes ?
                Object.keys(data_.groups.group_mapping.patient_to_sample) :
                Object.keys(data_.groups.group_mapping.sample_to_patient);

              selectedAttrMeta.view_type = 'table';
              selectedAttrMeta.layout = [1, 4];
              selectedAttrMeta.type = 'pieLabel';
              selectedAttrMeta.options = {
                allCases: uids,
                sequencedCases: uids
              };
            }
          });

          // Hide all attributes if no data available for selected cases.
          // Basically all NAs
          _.each(_.difference(attrIds, Object.keys(attrsFromServer)), function(_attrId) {
            var selectedAttrMeta = charts[_attrId];

            hasAttrDataMap[_attrId] = '';
            selectedAttrMeta.keys = {};
            selectedAttrMeta.numOfDatum = 0;
            selectedAttrMeta.show = false;
          });

          def.resolve();
        }, function() {
          def.reject();
        });
      return def.promise();
    },
    extractMutationData: function(_mutationData, _allSamples) {
      var _mutGeneMeta = {};
      var _allMutGenes = _.pluck(_mutationData, 'gene_symbol');
      var _mutGeneMetaIndex = 0;
      var self = this;
      _.each(_mutationData, function(_mutGeneDataObj) {
        var _uniqueId = _mutGeneDataObj.gene_symbol;
        _.each(_mutGeneDataObj.caseIds, function(_caseId) {
          var _caseUIdIndex = self.getCaseIndex('sample', _mutGeneDataObj.study_id, _caseId);
          if (_mutGeneMeta[_uniqueId] === undefined) {
            _mutGeneMeta[_uniqueId] = {};
            _mutGeneMeta[_uniqueId].gene = _uniqueId;
            _mutGeneMeta[_uniqueId].num_muts = 1;
            _mutGeneMeta[_uniqueId].case_ids = [_caseUIdIndex];
            _mutGeneMeta[_uniqueId].qval = (window.iviz.datamanager.getCancerStudyIds().length === 1 && _mutGeneDataObj.hasOwnProperty('qval')) ? _mutGeneDataObj.qval : null;
            _mutGeneMeta[_uniqueId].index = _mutGeneMetaIndex;
            if (data_.groups.sample.data[_caseUIdIndex].mutated_genes === undefined) {
              data_.groups.sample.data[_caseUIdIndex].mutated_genes = [_mutGeneMetaIndex];
            } else {
              data_.groups.sample.data[_caseUIdIndex].mutated_genes.push(_mutGeneMetaIndex);
            }
            _mutGeneMetaIndex += 1;
          } else {
            _mutGeneMeta[_uniqueId].num_muts += 1;
            _mutGeneMeta[_uniqueId].case_ids.push(_caseUIdIndex);
            if (data_.groups.sample.data[_caseUIdIndex].mutated_genes === undefined) {
              data_.groups.sample.data[_caseUIdIndex].mutated_genes = [_mutGeneMeta[_uniqueId].index];
            } else {
              data_.groups.sample.data[_caseUIdIndex].mutated_genes.push(_mutGeneMeta[_uniqueId].index);
            }
          }
        });
      });

      _.each(_mutGeneMeta, function(content) {
        content.case_uids = iViz.util.unique(content.case_ids);
      });

      tableData_.mutated_genes = {};
      tableData_.mutated_genes.geneMeta = _mutGeneMeta;
      tableData_.mutated_genes.allGenes = _allMutGenes;
      tableData_.mutated_genes.allSamples = [];

      _.each(_allSamples, function(samples, studyId) {
        _.each(samples, function(sampleId) {
          tableData_.mutated_genes.allSamples.push({
            "molecularProfileId": window.iviz.datamanager.getMutationProfileIdByStudyId(studyId),
            "sampleId": sampleId
          })
        })
      });
      return tableData_.mutated_genes;
    },
    extractCnaData: function(_cnaData, _allSamples) {
      var _cnaMeta = {};
      var _allCNAGenes = {};
      var _cnaMetaIndex = 0;
      var self = this;
      $.each(_cnaData, function(_studyId, _cnaDataPerStudy) {
        $.each(_cnaDataPerStudy.caseIds, function(_index, _caseIdsPerGene) {
          var _geneSymbol = _cnaDataPerStudy.gene[_index];
          var _altType = '';
          _allCNAGenes[_geneSymbol] = 1;
          switch (_cnaDataPerStudy.alter[_index]) {
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
            var _caseIdIndex = self.getCaseIndex('sample', _studyId, _caseId);
            if (_cnaMeta[_uniqueId] === undefined) {
              _cnaMeta[_uniqueId] = {};
              _cnaMeta[_uniqueId].gene = _geneSymbol;
              _cnaMeta[_uniqueId].cna = _altType;
              _cnaMeta[_uniqueId].cytoband = _cnaDataPerStudy.cytoband[_index];
              _cnaMeta[_uniqueId].case_ids = [_caseIdIndex];
              if ((window.iviz.datamanager.getCancerStudyIds().length !== 1) || _cnaDataPerStudy.gistic[_index] === null) {
                _cnaMeta[_uniqueId].qval = null;
              } else {
                _cnaMeta[_uniqueId].qval = _cnaDataPerStudy.gistic[_index][0];
              }
              _cnaMeta[_uniqueId].index = _cnaMetaIndex;
              if (data_.groups.sample.data[_caseIdIndex].cna_details === undefined) {
                data_.groups.sample.data[_caseIdIndex].cna_details = [_cnaMetaIndex];
              } else {
                data_.groups.sample.data[_caseIdIndex].cna_details.push(_cnaMetaIndex);
              }
              _cnaMetaIndex += 1;
            } else {
              _cnaMeta[_uniqueId].case_ids.push(_caseIdIndex);
              if (data_.groups.sample.data[_caseIdIndex].cna_details === undefined) {
                data_.groups.sample.data[_caseIdIndex].cna_details = [_cnaMeta[_uniqueId].index];
              } else {
                data_.groups.sample.data[_caseIdIndex].cna_details.push(_cnaMeta[_uniqueId].index);
              }
            }
          });
        });
      });

      _.each(_cnaMeta, function(content) {
        content.case_uids = iViz.util.unique(content.case_ids);
      });

      tableData_.cna_details = {};
      tableData_.cna_details.geneMeta = _cnaMeta;
      tableData_.cna_details.allGenes = Object.keys(_allCNAGenes);
      tableData_.cna_details.allSamples = [];

      _.each(_allSamples, function(samples, studyId) {
        _.each(samples, function(sampleId) {
          tableData_.cna_details.allSamples.push({
            "molecularProfileId": window.iviz.datamanager.getCNAProfileIdByStudyId(studyId),
            "sampleId": sampleId
          })
        })
      });
      return tableData_.cna_details;
    },
    getTableData: function(attrId, progressFunc) {
      var def = new $.Deferred();
      var self = this;
      if (tableData_[attrId] === undefined) {
        if (attrId === 'mutated_genes') {
          $.when(window.iviz.datamanager.getMutData(progressFunc))
            .then(function(_data) {
              def.resolve(self.extractMutationData(_data, window.iviz.datamanager.getAllMutatedGeneSamples()));
            }, function() {
              def.reject();
            });
        } else if (attrId === 'cna_details') {
          $.when(window.iviz.datamanager.getCnaData(progressFunc))
            .then(function(_data) {
              def.resolve(self.extractCnaData(_data, window.iviz.datamanager.getAllCNASamples()));
            }, function() {
              def.reject();
            });
        }
      } else {
        def.resolve(tableData_[attrId]);
      }
      return def.promise();
    },
    getScatterData: function(_self) {
      var def = new $.Deferred();
      var self = this;
      var data = {};

      $.when(window.iviz.datamanager.getSampleClinicalData(['MUTATION_COUNT', 'FRACTION_GENOME_ALTERED']))
        .then(function(_clinicalData) {
          var groupId = _self.attributes.group_id;
          data = self.getGroupNdx(groupId);
          def.resolve(data);
        }, function() {
          def.reject();
        });
      return def.promise();
    },
    getCasesMap: function(type) {
      if (type === 'sample') {
        return data_.groups.group_mapping.sample_to_patient;
      }
      return data_.groups.group_mapping.patient_to_sample;
    },
    getCaseUIDs: function(type) {
      return Object.keys(this.getCasesMap(type));
    },
    getCaseIndex: function(type, study_id, case_id) {
      if (!data_.groups.group_mapping.studyMap[study_id]) {
        return undefined;
      }
      if (type === 'sample') {
        return data_.groups.group_mapping.studyMap[study_id].sample_to_uid[case_id];
      }
      return data_.groups.group_mapping.studyMap[study_id].patient_to_uid[case_id];
    },
    getCaseUID: function(type, case_id) {
      return Object.keys(data_.groups.group_mapping.studyMap).reduce(function(a, b) {
        var _uid = data_.groups.group_mapping.studyMap[b][type + '_to_uid'][case_id];
        return (_uid === undefined) ? a : a.concat(_uid);
      }, []);
    },
    getCaseIdUsingUID: function(type, case_uid) {
      if (type === 'sample') {
        return data_.groups.sample.data[parseInt(case_uid, 10)].sample_id;
      }
      return data_.groups.patient.data[parseInt(case_uid, 10)].patient_id;
    },
    getPatientUIDs: function(sampleUID) {
      return this.getCasesMap('sample')[sampleUID];
    },
    getSampleUIDs: function(patientUID) {
      return this.getCasesMap('patient')[patientUID];
    },
    getPatientId: function(studyId, sampleId) {
      return data_.groups.group_mapping.studyMap[studyId].sample_to_patient[sampleId];
    },
    getSampleIds: function(studyId, patientId) {
      return data_.groups.group_mapping.studyMap[studyId].patient_to_sample[patientId];
    },
    getStudyCacseIdsUsingUIDs: function(type, uids) {
      var ids = [];
      _.each(uids, function(uid) {
        ids.push({
          studyId: data_.groups[type].data[uid].study_id,
          caseId: data_.groups[type].data[uid].sample_id
        });
      });
      return ids;
    },
    openCases: function() {
      var _selectedCasesMap = {};
      var _patientData = data_.groups.patient.data;
      $.each(vm_.selectedpatientUIDs, function(key, patientUID) {
        var _caseDataObj = _patientData[patientUID];
        if (!_selectedCasesMap[_caseDataObj.study_id]) {
          _selectedCasesMap[_caseDataObj.study_id] = [];
        }
        _selectedCasesMap[_caseDataObj.study_id].push(_caseDataObj.patient_id);
      });

      var _study_id = Object.keys(_selectedCasesMap)[0];
      var _selectedCaseIds = _selectedCasesMap[_study_id].sort();
      var _url = '';

      _url = window.cbioURL +
        'case.do#/patient?studyId=' +
        _study_id +
        '&caseId=' +
        _selectedCaseIds[0] +
        '#navCaseIds=' + getNavCaseIdsStr(_selectedCasesMap, _selectedCaseIds, false).str;

      // The IE URL limitation is 2083
      // https://blogs.msdn.microsoft.com/ieinternals/2014/08/13/url-length-limits/
      // But for safe, we decrease the limit to 1800
      if (_url.length > URLlenLimit) {
        var browser = cbio.util.browser;
        if (browser.msie || browser.edge) {
          var limit = getNavCaseIdsStr(_selectedCasesMap, _selectedCaseIds, true).limit;
          var limit = limit > 50 ?
            (Math.floor(limit / 50) * 50) : Math.floor(limit / 5) * 5;
          var browserName = 'Internet Explorer';
          if (browser.edge) {
            browserName = 'Microsoft Edge'
          }
          new Notification().createNotification(
            'Too many selected samples to browse due to URL length limit of' +
            ' ' + browserName + '. ' +
            ' Please select less than ' + limit + ' samples, or use another browser.',
            {message_type: 'danger'});
        } else {
          window.open(_url);
        }
      } else {
        window.open(_url);
      }
    },
    downloadCaseData: function() {
      var _def = new $.Deferred();
      var sampleUIds_ = vm_.selectedsampleUIDs;
      var attr = {};
      var self = this;

      $.when(this.fetchCompleteData('patient', true), this.fetchCompleteData('sample', true)).then(function() {
        attr.CANCER_TYPE_DETAILED = 'Cancer Type Detailed';
        attr.CANCER_TYPE = 'Cancer Type';
        attr.study_id = 'Study ID';
        attr.patient_id = 'Patient ID';
        attr.sample_id = 'Sample ID';

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
        _.each(sampleUIds_, function(sampleUId) {
          var temp = data_.groups.sample.data[sampleUId];
          var temp1 = $.extend({}, temp,
            data_.groups.patient.data[self.getPatientUIDs(sampleUId)[0]]);
          arr.push(temp1);
        });

        for (var i = 0; i < arr.length; i++) {
          strA.length = 0;
          strA = iViz.util.getAttrVal(attr, arr[i]);
          content += '\r\n' + strA.join('\t');
        }

        var downloadOpts = {
          filename: 'study_view_clinical_data.txt',
          contentType: 'text/plain;charset=utf-8',
          preProcess: false
        };

        cbio.download.initDownload(content, downloadOpts);
        _def.resolve();
      }, function() {
        // TODO: give warning/error message to user if the download is failed
        _def.resolve();
      });
      return _def.promise();
    },
    submitForm: function(cohortIdsList) {
      // Remove all hidden inputs
      $('#iviz-form input:not(:first)').remove();

      
          QueryByGeneUtil. query (cohortIdsList ? cohortIdsList: window.cohortIdsList, this.stat(),
          QueryByGeneTextArea.getGenes(), includeCases)
    },
    stat: function() {
      var _result = {};
      _result.origin = window.cohortIdsList;
      _result.filters = {};
      var self = this;

      // extract and reformat selected cases
      var _studies = [];
      var _selectedStudyCasesMap = {};
      var _sampleData = data_.groups.sample.data;

      $.each(vm_.selectedsampleUIDs, function(key, sampleUID) {
        var _caseDataObj = _sampleData[sampleUID];
        if (!_selectedStudyCasesMap[_caseDataObj.study_id]) {
          _selectedStudyCasesMap[_caseDataObj.study_id] = {};
          _selectedStudyCasesMap[_caseDataObj.study_id].id = _caseDataObj.study_id;
          _selectedStudyCasesMap[_caseDataObj.study_id].samples = [];
          _selectedStudyCasesMap[_caseDataObj.study_id].patients = {};
        }
        _selectedStudyCasesMap[_caseDataObj.study_id].samples.push(_caseDataObj.sample_id);
        var _patientId = self.getPatientId(_caseDataObj.study_id, _caseDataObj.sample_id);
        _selectedStudyCasesMap[_caseDataObj.study_id].patients[_patientId] = 1;
      });
      $.each(_selectedStudyCasesMap, function(key, val) {
        val.patients = Object.keys(val.patients);
        _studies.push(val);
      });
      _result.filters.patients = [];
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
              if (attributes.attr_id === 'MUT_CNT_VS_CNA') {
                filters_[attributes.attr_id] =
                  _.map(self.getStudyCacseIdsUsingUIDs('sample', filters_[attributes.attr_id]), function(item) {
                    return item.studyId + ':' + item.caseId;
                  });
              }
            }
          });
          temp = $.extend(true, _result.filters.samples, filters_);
          array = $.extend(true, {}, temp);
          _result.filters.samples = array;
        }
      });

      if (vm_.customfilter.sampleUids.length > 0
        || vm_.customfilter.patientUids.length > 0) {
        var type = vm_.customfilter.type === 'sample' ? 'samples' : 'patients';
        var uidsType = type === 'samples' ? 'sampleUids' : 'patientUids';
        _result.filters[type][vm_.customfilter.id] =
          _.map(self.getStudyCacseIdsUsingUIDs(vm_.customfilter.type, vm_.customfilter[uidsType]), function(item) {
            return item.studyId + ':' + item.caseId;
          });
      }
      _result.studies = _studies;
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
      _.each(_.pluck(_vc.studies, 'samples'), function(_arr) {
        _selectedSamples = _selectedSamples.concat(_arr);
      });
      _.each(_.pluck(_vc.studies, 'patients'), function(_arr) {
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
