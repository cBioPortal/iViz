'use strict';
(function (iViz, $, _) {

  iViz.data = {};

  iViz.data.init = function (_portalUrl, _study_cases_map, _callbackFunc) {
    var initialSetup = function () {
      var self = this;
      $.when(this.getGeneticProfiles(), this.getCaseLists(), this.getStudyToSampleToPatientdMap(), this.getSampleClinicalAttributes(),
        this.getPatientClinicalAttributes(), this.getCnaFractionData()).then(function (_geneticProfiles, _caseLists,
                                                                                       _studyToSampleToPatientdMap,
                                                                                       _sampleAttributes,
                                                                                       _patientAttributes,
                                                                                       _cnaFractionData) {
        _patientAttributes = _.values(_patientAttributes);
        _sampleAttributes = _.values(_sampleAttributes);

        /* Uncomment this to laod limited number of clinical attributes data
         var _selectedpatientAttrs = _patientAttributes.slice(0, 10);
         var _selectedSampleAttrs = _sampleAttributes.slice(0, 10);
         var _selectedpatientAttrIds = _.pluck(_selectedpatientAttrs,'attr_id');
         var _selectedsampleAttrIds = _.pluck(_selectedSampleAttrs,'attr_id');*/

        /* Comment this  to laod limited number of clinical attributes data */
        var _selectedpatientAttrs = _patientAttributes;
        var _selectedSampleAttrs = _sampleAttributes;
        var _selectedpatientAttrIds = _.pluck(_selectedpatientAttrs, 'attr_id');
        var _selectedsampleAttrIds = _.pluck(_selectedSampleAttrs, 'attr_id');
        $.when(self.getPatientClinicalData(_selectedpatientAttrIds), self.getSampleClinicalData(_selectedsampleAttrIds),
          self.getCnaData(), self.getMutationCount(), self.getMutData()).then(function (_patientClinicalData,
                                                                                        _sampleClinicalData,
                                                                                        _cnaData, _mutationCountData,
                                                                                        _mutationData) {
          var _hasMutationCNAScatterPlotData = _.keys(_cnaFractionData).length > 0;
          var _hasMutationCountData = _.keys(_mutationCountData).length > 0;
          var _hasCNAData = false;
          var _hasMutationData = false;
          var _result = {};

          var _patientData = [], _sampleData = [];
          var _indexSample = 0, _sampleDataIndicesObj = {};
          var _indexPatient = 0, _patientDataIndicesObj = {};
          var _hasDFS = false, _hasOS = false;

          // TODO : temporary fix to show/hide charts
          // define view type from data type
          _.each(_sampleAttributes, function (_metaObj) {
            _metaObj.filter = [];
            _metaObj.show = true;
            if (_metaObj.datatype === "NUMBER") {
              _metaObj.view_type = 'bar_chart';
            } else if (_metaObj.datatype === "STRING") {
              _metaObj.view_type = 'pie_chart';
            }
          });
          _.each(_patientAttributes, function (_metaObj) {
            _metaObj.filter = [];
            _metaObj.show = true;
            if (_metaObj.datatype === "NUMBER") {
              _metaObj.view_type = 'bar_chart';
            } else if (_metaObj.datatype === "STRING") {
              _metaObj.view_type = 'pie_chart';
            }
          });

          /*_.each(_selectedpatientAttrs,function(_metaObj){
           _metaObj.show = true;
           });
           _.each(_selectedSampleAttrs,function(_metaObj){
           _metaObj.show = true;
           });*/

          // map clinical data to each patient (key: patient ID, value: object of attributes vs. val)
          var _patientIdToClinDataMap = {};
          _.each(_patientClinicalData, function (_patientAttributeData) {
            _.each(_patientAttributeData, function (_dataObj) {
              if (_patientIdToClinDataMap[_dataObj.patient_id] === undefined) {
                _patientIdToClinDataMap[_dataObj.patient_id] = {};
              }
              _patientIdToClinDataMap[_dataObj.patient_id][_dataObj.attr_id] = _dataObj.attr_val;
            });
          });

          // map clinical data to each sample (key: sample ID, value: object of attributes vs. val)
          var _sampleIdToClinDataMap = {};
          _.each(_sampleClinicalData, function (_sampleAttributeData) {
            _.each(_sampleAttributeData, function (_dataObj) {
              if (_sampleIdToClinDataMap[_dataObj.sample_id] === undefined) {
                _sampleIdToClinDataMap[_dataObj.sample_id] = {};
              }
              _sampleIdToClinDataMap[_dataObj.sample_id][_dataObj.attr_id] = _dataObj.attr_val;
            });
          });

          var _samplesToPatientMap = {};
          var _patientToSampleMap = {};

          _.each(_studyToSampleToPatientdMap, function (_sampleToPatientMap, _studyId) {
            _.each(_sampleToPatientMap, function (_patientId, _sampleId) {
              if (_samplesToPatientMap[_sampleId] === undefined) {
                _samplesToPatientMap[_sampleId] = [_patientId];
              }
              if (_patientToSampleMap[_patientId] === undefined) {
                _patientToSampleMap[_patientId] = [_sampleId];
              } else {
                _patientToSampleMap[_patientId].push(_sampleId);
              }

              if (_patientDataIndicesObj[_patientId] === undefined) {
                // create datum for each patient
                var _patientDatum = {};
                if (_patientIdToClinDataMap[_patientId] !== undefined) {
                  _patientDatum = _patientIdToClinDataMap[_patientId];
                }
                _patientDatum['patient_id'] = _patientId;
                _patientDatum['study_id'] = _studyId;

                if (_patientDatum.hasOwnProperty('DFS_STATUS') && _patientDatum.hasOwnProperty('DFS_MONTHS') &&
                  _patientDatum['DFS_STATUS'] !== 'NA' && _patientDatum['DFS_MONTHS'] !== 'NA') {
                  _hasDFS = true;
                }
                if (_patientDatum.hasOwnProperty('OS_STATUS') && _patientDatum.hasOwnProperty('OS_MONTHS') &&
                  _patientDatum['OS_STATUS'] !== 'NA' && _patientDatum['OS_MONTHS'] !== 'NA') {
                  _hasOS = true;
                }


                _patientData.push(_patientDatum);
                _patientDataIndicesObj[_patientId] = _indexPatient;
                _indexPatient += 1;
              }

              // create datum for each sample
              var _sampleDatum = {};
              if (_sampleIdToClinDataMap[_sampleId] !== undefined) {
                _sampleDatum = _sampleIdToClinDataMap[_sampleId];
              }
              _sampleDatum['sample_id'] = _sampleId;
              _sampleDatum['study_id'] = _studyId;


              // mutation count
              if (_hasMutationCountData) {
                if (_mutationCountData[_sampleId] === undefined || _mutationCountData[_sampleId] === null) {
                  _sampleDatum['mutation_count'] = 'NA';
                } else {
                  _sampleDatum['mutation_count'] = _mutationCountData[_sampleId];
                }
              }

              // cna fraction
              if (_hasMutationCNAScatterPlotData) {
                if (_cnaFractionData[_sampleId] === undefined || _cnaFractionData[_sampleId] === null) {
                  _sampleDatum['cna_fraction'] = 0;
                } else {
                  _sampleDatum['cna_fraction'] = _cnaFractionData[_sampleId];
                }
              }
              _sampleData.push(_sampleDatum);
              // indices
              _sampleDataIndicesObj[_sampleId] = _indexSample;
              _indexSample += 1;
            });
          });

          // extract mutation data
          var _mutGeneMeta = {}, _mutGeneMetaIndex = 0;
          _.each(_mutationData, function (_mutGeneDataObj) {
            _hasMutationData = true;
            var _geneSymbol = _mutGeneDataObj.gene_symbol;
            _.each(_mutGeneDataObj.caseIds, function (_caseId) {
              if (_sampleDataIndicesObj[_caseId] !== undefined) {
                var _caseIdIndex = _sampleDataIndicesObj[_caseId];
                if (_mutGeneMeta[_geneSymbol] !== undefined) {
                  _mutGeneMeta[_geneSymbol].num_muts += 1;
                  _mutGeneMeta[_geneSymbol].caseIds.push(_caseId);
                  if (_sampleData[_caseIdIndex]['mutated_genes'] !== undefined) {
                    _sampleData[_caseIdIndex]['mutated_genes'].push(_mutGeneMeta[_geneSymbol].index)
                  } else {
                    _sampleData[_caseIdIndex]['mutated_genes'] = [_mutGeneMeta[_geneSymbol].index]
                  }
                } else {
                  _mutGeneMeta[_geneSymbol] = {};
                  _mutGeneMeta[_geneSymbol].gene = _geneSymbol;
                  _mutGeneMeta[_geneSymbol].num_muts = 1;
                  _mutGeneMeta[_geneSymbol].caseIds = [_caseId];
                  _mutGeneMeta[_geneSymbol].qval = (self.getCancerStudyIds().length === 1 && _mutGeneDataObj.hasOwnProperty('qval')) ? _mutGeneDataObj.qval : null;
                  _mutGeneMeta[_geneSymbol].index = _mutGeneMetaIndex;
                  if (_sampleData[_caseIdIndex]['mutated_genes'] !== undefined) {
                    _sampleData[_caseIdIndex]['mutated_genes'].push(_mutGeneMetaIndex)
                  } else {
                    _sampleData[_caseIdIndex]['mutated_genes'] = [_mutGeneMetaIndex]
                  }
                  _mutGeneMetaIndex += 1;
                }
              }
            });
          });

          // extract cna data
          var _cnaMeta = {}, _cnaMetaIndex = 0;
          $.each(_cnaData.caseIds, function (_index, _caseIdsPerGene) {
            _hasCNAData = true;
            var _geneSymbol = _cnaData.gene[_index];
            _.each(_caseIdsPerGene, function (_caseId) {
              if (_sampleDataIndicesObj[_caseId] !== undefined) {
                var _caseIdIndex = _sampleDataIndicesObj[_caseId];
                if (_cnaMeta[_geneSymbol] !== undefined) {
                  _cnaMeta[_geneSymbol].caseIds.push(_caseId);
                  if (_sampleData[_caseIdIndex]['cna_details'] !== undefined) {
                    _sampleData[_caseIdIndex]['cna_details'].push(_cnaMeta[_geneSymbol].index)
                  } else {
                    _sampleData[_caseIdIndex]['cna_details'] = [_cnaMeta[_geneSymbol].index]
                  }
                } else {
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
                  if ((self.getCancerStudyIds().length !== 1) || _cnaData.gistic[_index] === null) {
                    _cnaMeta[_geneSymbol].qval = null;
                  } else {
                    _cnaMeta[_geneSymbol].qval = _cnaData.gistic[_index][0];
                  }
                  _cnaMeta[_geneSymbol].index = _cnaMetaIndex;
                  if (_sampleData[_caseIdIndex]['cna_details'] !== undefined) {
                    _sampleData[_caseIdIndex]['cna_details'].push(_cnaMetaIndex)
                  } else {
                    _sampleData[_caseIdIndex]['cna_details'] = [_cnaMetaIndex]
                  }
                  _cnaMetaIndex += 1;
                }
              }
            });
          });

          // add mutation count 
          if (_hasMutationCountData) {
            var _MutationCountMeta = {};
            _MutationCountMeta.datatype = 'NUMBER';
            _MutationCountMeta.description = "Mutation Count";
            _MutationCountMeta.display_name = "Mutation Count";
            _MutationCountMeta.attr_id = "mutation_count";
            _MutationCountMeta.view_type = 'bar_chart';
            _MutationCountMeta.filter = [];
            _MutationCountMeta.show = true;
            _sampleAttributes.unshift(_MutationCountMeta);
          }

          // add CNA details
          if (_hasCNAData) {
            var _cnaAttrMeta = {};
            _cnaAttrMeta.type = 'cna';
            _cnaAttrMeta.view_type = 'table';
            _cnaAttrMeta.display_name = 'Copy Number Alterations';
            _cnaAttrMeta.description = 'Copy Number Alterations';
            _cnaAttrMeta.gene_list = _cnaMeta;
            _cnaAttrMeta.attr_id = 'cna_details';
            _cnaAttrMeta.filter = [];
            _cnaAttrMeta.show = true;
            _cnaAttrMeta.options = {
              allCases: _caseLists.allSampleIds,
              sequencedCases: _caseLists.cnaSampleIds.length > 0 ? _caseLists.cnaSampleIds : _caseLists.allSampleIds
            };
            _sampleAttributes.unshift(_cnaAttrMeta);
          }

          // add Gene Mutation Info
          if (_hasMutationData) {
            var _mutDataAttrMeta = {};
            _mutDataAttrMeta.type = 'mutatedGene';
            _mutDataAttrMeta.view_type = 'table';
            _mutDataAttrMeta.display_name = 'Mutated Genes';
            _mutDataAttrMeta.description = 'Mutated Genes';
            _mutDataAttrMeta.gene_list = _mutGeneMeta;
            _mutDataAttrMeta.attr_id = 'mutated_genes';
            _mutDataAttrMeta.filter = [];
            _mutDataAttrMeta.show = true;
            _mutDataAttrMeta.options = {
              allCases: _caseLists.allSampleIds,
              sequencedCases: _caseLists.sequencedSampleIds.length > 0 ? _caseLists.sequencedSampleIds : _caseLists.allSampleIds
            };
            _sampleAttributes.unshift(_mutDataAttrMeta);
          }

          // add Mutation count vs. CNA fraction
          if (_hasMutationCNAScatterPlotData) {
            var _mutCntAttrMeta = {};
            _mutCntAttrMeta.attr_id = 'MUT_CNT_VS_CNA';
            _mutCntAttrMeta.datatype = 'SCATTER_PLOT';
            _mutCntAttrMeta.view_type = 'scatter_plot';
            _mutCntAttrMeta.description = 'Mutation Count vs. CNA';
            _mutCntAttrMeta.display_name = 'Mutation Count vs. CNA';
            _mutCntAttrMeta.filter = [];
            _mutCntAttrMeta.show = true;
            _sampleAttributes.unshift(_mutCntAttrMeta);
          }

          // add survival
          /*var _hasDFS = false, _hasOS = false;
           _.each(_patientData, function(_patientDataObj) {
           if (_patientDataObj.hasOwnProperty('DFS_STATUS') && _patientDataObj.hasOwnProperty('DFS_MONTHS') &&
           _patientDataObj['DFS_STATUS'] !== 'NA' && _patientDataObj['DFS_MONTHS'] !== 'NA') {
           _hasDFS = true;
           }
           if (_patientDataObj.hasOwnProperty('OS_STATUS') && _patientDataObj.hasOwnProperty('OS_MONTHS') &&
           _patientDataObj['OS_STATUS'] !== 'NA' && _patientDataObj['OS_MONTHS'] !== 'NA') {
           _hasOS = true;
           }
           });*/
          if (_hasDFS) {
            var _dfsSurvivalAttrMeta = {};
            _dfsSurvivalAttrMeta.attr_id = 'DFS_SURVIVAL';
            _dfsSurvivalAttrMeta.datatype = 'SURVIVAL';
            _dfsSurvivalAttrMeta.view_type = 'survival';
            _dfsSurvivalAttrMeta.description = 'Disease Free Survival';
            _dfsSurvivalAttrMeta.display_name = 'Disease Free Survival';
            _dfsSurvivalAttrMeta.filter = [];
            _dfsSurvivalAttrMeta.show = true;
            _patientAttributes.unshift(_dfsSurvivalAttrMeta);
          }
          if (_hasOS) {
            var _osSurvivalAttrMeta = {};
            _osSurvivalAttrMeta.attr_id = 'OS_SURVIVAL';
            _osSurvivalAttrMeta.datatype = 'SURVIVAL';
            _osSurvivalAttrMeta.view_type = 'survival';
            _osSurvivalAttrMeta.description = 'Overall Survival';
            _osSurvivalAttrMeta.display_name = 'Overall Survival';
            _osSurvivalAttrMeta.filter = [];
            _osSurvivalAttrMeta.show = true;
            _patientAttributes.unshift(_osSurvivalAttrMeta);
          }

          // add Cancer Study
          if (self.getCancerStudyIds().length > 1) {
            _patientAttributes.unshift({
              "datatype": "STRING",
              "description": "Cancer Studies",
              "display_name": "Cancer Studies",
              "attr_id": "study_id",
              "view_type": "pie_chart",
              "filter": [],
              "show": true
            });
          }

          _result.groups = {};
          _result.groups.patient = {};
          _result.groups.sample = {};
          _result.groups.group_mapping = {};
          _result.groups.patient.attr_meta = _patientAttributes;
          _result.groups.sample.attr_meta = _sampleAttributes;
          _result.groups.patient.data = _patientData;
          _result.groups.sample.data = _sampleData;
          _result.groups.patient.data_indices = {};
          _result.groups.sample.data_indices = {};
          _result.groups.patient.data_indices.patient_id = _patientDataIndicesObj;
          _result.groups.sample.data_indices.sample_id = _sampleDataIndicesObj;
          _result.groups.group_mapping.sample = {};
          _result.groups.group_mapping.patient = {};
          _result.groups.group_mapping.sample.patient = _samplesToPatientMap;
          _result.groups.group_mapping.patient.sample = _patientToSampleMap;

          self.callbackFunc(_result);
        });
      });
    };

    var getPatientClinicalData = function (self, attr_ids) {
      var def = new $.Deferred();
      var fetch_promises = [];
      var clinical_data = {};
      attr_ids = attr_ids.slice();
      $.when(self.getPatientClinicalAttributes(), self.getStudyCasesMap()).then(function (attributes, studyCasesMap) {
        var studyAttributesMap = {};
        _.each(attr_ids, function (_attrId) {
          var attrDetails = attributes[_attrId];
          _.each(attrDetails.study_ids, function (studyId) {
            if (studyAttributesMap[studyId] !== undefined) {
              studyAttributesMap[studyId].push(attrDetails.attr_id);
            } else {
              studyAttributesMap[studyId] = [attrDetails.attr_id];
            }
          });
        });

        fetch_promises = fetch_promises.concat(Object.keys(studyAttributesMap).map(function (_studyId) {
          var _def = new $.Deferred();
          window.cbioportal_client.getPatientClinicalData({
              study_id: [_studyId],
              attribute_ids: studyAttributesMap[_studyId],
              patient_ids: studyCasesMap[_studyId].patients
            })
            .then(function (data) {
              var patient_data_by_attr_id = {};
              for (var i = 0; i < data.length; i++) {
                var attr_id = data[i].attr_id;
                clinical_data[attr_id] = clinical_data[attr_id] || [];
                clinical_data[attr_id].push(data[i]);
              }
              _def.resolve();
            }).fail(function () {
            def.reject();
          });
          return _def.promise();
        }));
        $.when.apply($, fetch_promises).then(function () {
          def.resolve(clinical_data);
        });
      });
      return def.promise();
    };

    var getSampleClinicalData = function (self, attr_ids) {
      var def = new $.Deferred();
      var fetch_promises = [];
      var clinical_data = {};
      attr_ids = attr_ids.slice();
      $.when(self.getSampleClinicalAttributes(), self.getStudyCasesMap()).then(function (attributes, studyCasesMap) {
        var studyAttributesMap = {};
        _.each(attr_ids, function (_attrId) {
          var attrDetails = attributes[_attrId];
          _.each(attrDetails.study_ids, function (studyId) {
            if (studyAttributesMap[studyId] !== undefined) {
              studyAttributesMap[studyId].push(attrDetails.attr_id);
            } else {
              studyAttributesMap[studyId] = [attrDetails.attr_id];
            }
          });
        });

        fetch_promises = fetch_promises.concat(Object.keys(studyAttributesMap).map(function (_studyId) {
          var _def = new $.Deferred();
          window.cbioportal_client.getSampleClinicalData({
              study_id: [_studyId],
              attribute_ids: studyAttributesMap[_studyId],
              patient_ids: studyCasesMap[_studyId].samples
            })
            .then(function (data) {
              var patient_data_by_attr_id = {};
              for (var i = 0; i < data.length; i++) {
                var attr_id = data[i].attr_id;
                clinical_data[attr_id] = clinical_data[attr_id] || [];
                clinical_data[attr_id].push(data[i]);
              }
              _def.resolve();
            }).fail(function () {
            def.reject();
          });
          return _def.promise();
        }));
        $.when.apply($, fetch_promises).then(function () {
          def.resolve(clinical_data);
        });
      });
      return def.promise();
    };

    return {
      'cancerStudyIds': [],
      'portalUrl': _portalUrl,
      'callbackFunc' : _callbackFunc,
      'studyCasesMap': _study_cases_map,
      'initialSetup': initialSetup,
      'getCancerStudyIds': function () {
        if (this.cancerStudyIds.length === 0) {
          this.cancerStudyIds = _.keys(this.studyCasesMap);
        }
        return this.cancerStudyIds;
      },
      'getStudyCasesMap': function () {
        return window.cbio.util.deepCopyObject(this.studyCasesMap);
      },
      'getGeneticProfiles': window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var _profiles = [];
          var requests = self.getCancerStudyIds().map(
            function (cancer_study_id) {
              var def = new $.Deferred();
              window.cbioportal_client.getGeneticProfiles({study_id: [cancer_study_id]}).then(function (profiles) {
                _profiles = _profiles.concat(profiles);
                def.resolve();
              }).fail(function () {
                fetch_promise.reject();
              });
              return def.promise();
            });
          $.when.apply($, requests).then(function () {
            fetch_promise.resolve(_profiles);
          }).fail(function () {
            fetch_promise.reject();
          });
        }),
      'getCaseLists': window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var def = new $.Deferred();
          var _allSampleIds = [], _sequencedSampleIds = [], _cnaSampleIds = [];
          var requests = self.getCancerStudyIds().map(
            function (cancer_study_id) {
              var def = new $.Deferred();
              window.cbioportal_client.getSampleLists({study_id: [cancer_study_id]}).then(function (_sampleLists) {
                _.each(_sampleLists, function (_sampleList) {
                  if (_sampleList.id === cancer_study_id + "_sequenced") {
                    _sequencedSampleIds = _sequencedSampleIds.concat(_sampleList.sample_ids);
                  } else if (_sampleList.id === cancer_study_id + "_cna") {
                    _cnaSampleIds = _cnaSampleIds.concat(_sampleList.sample_ids);
                  } else if (_sampleList.id === cancer_study_id + "_all") {
                    _allSampleIds = _allSampleIds.concat(_sampleList.sample_ids);
                  }
                });
                def.resolve();
              }).fail(function () {
                fetch_promise.reject();
              });
              return def.promise();
            });
          $.when.apply($, requests).then(function () {
            var _completeSampleLists = {};
            _completeSampleLists['allSampleIds'] = _allSampleIds.sort();
            _completeSampleLists['sequencedSampleIds'] = _sequencedSampleIds.sort();
            _completeSampleLists['cnaSampleIds'] = _cnaSampleIds.sort();
            fetch_promise.resolve(_completeSampleLists);
          }).fail(function () {
            fetch_promise.reject();
          });
        }),
      'getSampleClinicalAttributes': window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var _studyCasesMap = self.getStudyCasesMap();
          var sample_clinical_attributes_set = {};
          var requests = self.getCancerStudyIds().map(
            function (cancer_study_id) {
              var def = new $.Deferred();
              window.cbioportal_client.getSampleClinicalAttributes({
                study_id: [cancer_study_id],
                sample_ids: _studyCasesMap[cancer_study_id].samples
              }).then(function (attrs) {
                for (var i = 0; i < attrs.length; i++) {
                  //TODO : Need to update logic incase if multiple studies have same attribute name but different properties
                  if (sample_clinical_attributes_set[attrs[i].attr_id] === undefined) {
                    attrs[i].study_ids = [cancer_study_id];
                    sample_clinical_attributes_set[attrs[i].attr_id] = attrs[i];
                  } else {
                    attrs[i].study_ids = sample_clinical_attributes_set[attrs[i].attr_id].study_ids.concat(cancer_study_id);
                    sample_clinical_attributes_set[attrs[i].attr_id] = attrs[i];
                  }
                }
                def.resolve();
              }).fail(function () {
                fetch_promise.reject();
              });
              return def.promise();
            });
          $.when.apply($, requests).then(function () {
            fetch_promise.resolve(sample_clinical_attributes_set);
          }).fail(function () {
            fetch_promise.reject();
          });
        }),
      'getPatientClinicalAttributes': window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var _studyCasesMap = self.getStudyCasesMap();
          var patient_clinical_attributes_set = {};
          var requests = self.getCancerStudyIds().map(
            function (cancer_study_id) {
              var def = new $.Deferred();
              window.cbioportal_client.getPatientClinicalAttributes({
                study_id: [cancer_study_id],
                patient_ids: _studyCasesMap[cancer_study_id].patients
              }).then(function (attrs) {
                for (var i = 0; i < attrs.length; i++) {
                  //TODO : Need to update logic incase if multiple studies have same attribute name but different properties
                  if (patient_clinical_attributes_set[attrs[i].attr_id] === undefined) {
                    attrs[i].study_ids = [cancer_study_id];
                    patient_clinical_attributes_set[attrs[i].attr_id] = attrs[i];
                  } else {
                    attrs[i].study_ids = patient_clinical_attributes_set[attrs[i].attr_id].study_ids.concat(cancer_study_id);
                    patient_clinical_attributes_set[attrs[i].attr_id] = attrs[i];
                  }
                }
                def.resolve();
              }).fail(function () {
                fetch_promise.reject();
              });
              return def.promise();
            });
          $.when.apply($, requests).then(function () {
            fetch_promise.resolve(patient_clinical_attributes_set);
          });
        }),
      'getStudyToSampleToPatientdMap': window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var study_to_sample_to_patient = {};
          var _studyCasesMap = self.getStudyCasesMap();
          var requests = self.getCancerStudyIds().map(
            function (cancer_study_id) {
              var def = new $.Deferred();
              window.cbioportal_client.getSamples({
                study_id: [cancer_study_id],
                sample_ids: _studyCasesMap[cancer_study_id].samples
              }).then(function (data) {
                var sample_to_patient = {};
                for (var i = 0; i < data.length; i++) {
                  sample_to_patient[data[i].id] = data[i].patient_id;
                }
                study_to_sample_to_patient[cancer_study_id] = sample_to_patient;
                def.resolve();
              }).fail(function () {
                fetch_promise.reject();
              });
              return def.promise();
            });
          $.when.apply($, requests).then(function () {
            fetch_promise.resolve(study_to_sample_to_patient);
          });
        }),
      'getCnaFractionData': window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var _ajaxCnaFractionData = {};
          var cancer_study_ids = self.getCancerStudyIds();
          var _studyCasesMap = self.getStudyCasesMap();
          var fetch_promises = [];
          fetch_promises = fetch_promises.concat(cancer_study_ids.map(
            function (_studyId) {
              var _def = new $.Deferred();
              var _data = {cmd: 'get_cna_fraction', cancer_study_id: _studyId};
              if (_studyCasesMap[_studyId].samples !== undefined) {
                _data.case_ids = _studyCasesMap[_studyId].samples.join(' ');
              }
              $.ajax({
                method: "POST",
                url: self.portalUrl + '/cna.json?',
                data: _data,
                success: function (response) {
                  _ajaxCnaFractionData = $.extend({}, response, _ajaxCnaFractionData);
                  _def.resolve();
                },
                error: function () {
                  fetch_promise.reject();
                }
              });
              return _def.promise();
            }));
          $.when.apply($, fetch_promises).then(function () {
            fetch_promise.resolve(_ajaxCnaFractionData);
          });
        }),
      'getCnaData': window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var _ajaxCnaData = {};
          var fetch_promises = [];
          $.when(self.getGeneticProfiles()).then(function (_profiles) {
            var _gisticProfiles = _.filter(_profiles, function (_profile) {
              return _profile.study_id + '_gistic' === _profile.id;
            });
            _ajaxCnaData.gene = [];
            _ajaxCnaData.gistic = [];
            _ajaxCnaData.cytoband = [];
            _ajaxCnaData.alter = [];
            _ajaxCnaData.caseIds = [];
            var _studyCasesMap = self.getStudyCasesMap();

            fetch_promises = fetch_promises.concat(_gisticProfiles.map(
              function (_gisticProfile) {
                var _def = new $.Deferred();
                var _samples = _studyCasesMap[_gisticProfile.study_id].samples;
                var _data = {cbio_genes_filter: true, cna_profile: _gisticProfile.id};
                if (_samples !== undefined) {
                  _data.sample_id = _samples.join(' ');
                }
                $.ajax({
                  method: "POST",
                  url: self.portalUrl + '/cna.json?',
                  data: _data,
                  success: function (response) {
                    _ajaxCnaData.gene = _ajaxCnaData.gene.concat(response.gene);
                    _ajaxCnaData.gistic = _ajaxCnaData.gistic.concat(response.gistic);
                    _ajaxCnaData.cytoband = _ajaxCnaData.cytoband.concat(response.cytoband);
                    _ajaxCnaData.alter = _ajaxCnaData.alter.concat(response.alter);
                    _ajaxCnaData.caseIds = _ajaxCnaData.caseIds.concat(response.caseIds);
                    _def.resolve();
                  },
                  error: function () {
                    fetch_promise.reject();
                  }
                });
                return _def.promise();
              }));
            $.when.apply($, fetch_promises).then(function () {
              fetch_promise.resolve(_ajaxCnaData);
            });
          });
        }),
      getMutationCount: window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var fetch_promises = [];
          var _ajaxMutationCountData = {};
          $.when(self.getGeneticProfiles()).then(function (_profiles) {
            var _mutationProfiles = _.filter(_profiles, function (_profile) {
              return _profile.study_id + '_mutations' === _profile.id;
            });
            var _studyCasesMap = self.getStudyCasesMap();
            fetch_promises = fetch_promises.concat(_mutationProfiles.map(
              function (_mutationProfile) {
                var _def = new $.Deferred();
                var _samples = _studyCasesMap[_mutationProfile.study_id].samples;
                var _data = {cmd: 'count_mutations', mutation_profile: _mutationProfile.id};
                if (_samples !== undefined) {
                  _data.case_ids = _samples.join(' ');
                }
                $.ajax({
                  method: "POST",
                  url: self.portalUrl + '/mutations.json?',
                  data: _data,
                  success: function (response) {
                    _ajaxMutationCountData = $.extend({}, response, _ajaxMutationCountData);
                    _def.resolve();
                  },
                  error: function () {
                    fetch_promise.reject();
                  }
                });
                return _def.promise();
              }));
            $.when.apply($, fetch_promises).then(function () {
              fetch_promise.resolve(_ajaxMutationCountData);
            });
          });
        }),
      getMutData: window.cbio.util.makeCachedPromiseFunction(
        function (self, fetch_promise) {
          var fetch_promises = [];
          var _mutDataStudyIdArr = {};
          $.when(self.getGeneticProfiles()).then(function (_profiles) {
            var _mutationProfiles = _.filter(_profiles, function (_profile) {
              return _profile.study_id + '_mutations' === _profile.id;
            });
            var _studyCasesMap = self.getStudyCasesMap();
            fetch_promises = fetch_promises.concat(_mutationProfiles.map(
              function (_mutationProfile) {
                var _def = new $.Deferred();
                var _samples = _studyCasesMap[_mutationProfile.study_id].samples;
                var _data = {cmd: 'get_smg', mutation_profile: _mutationProfile.id};
                if (_samples !== undefined) {
                  _data.case_list = _samples.join(' ');
                }
                $.ajax({
                  method: "POST",
                  url: self.portalUrl + '/mutations.json?',
                  data: _data,
                  success: function (response) {
                    _mutDataStudyIdArr = $.extend({}, response, _mutDataStudyIdArr);
                    _def.resolve();
                  },
                  error: function () {
                    fetch_promise.reject();
                  }
                });
                return _def.promise();
              }));
            $.when.apply($, fetch_promises).then(function () {
              fetch_promise.resolve(_mutDataStudyIdArr);
            });
          });
        }),
      'getSampleClinicalData': function (attribute_ids) {
        return getSampleClinicalData(this, attribute_ids);
      },
      'getPatientClinicalData': function (attribute_ids) {
        return getPatientClinicalData(this, attribute_ids);
      }
    };
  };
}(window.iViz, window.$, window._));
