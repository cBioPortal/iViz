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

/**
 * @author suny1@mskcc.org on 3/30/16.
 *
 * retriving results in JSON from web APIs and converting/assemble to iViz format
 *
 */

'use strict';
(function (iViz, $) {

  iViz.data = {};

  iViz.data.init = function (_portalInstURL, _studyIdArr, _callbackFunc, _inputSampleList, _inputPatientList) {

    var _result = {};
    var PORTAL_INST_URL = _portalInstURL;
    
    var _hasOSSurvivalData = false, _hasDFSSurvivalData = false, _hasMutationCNAScatterPlotData = false;
    
    var _ajaxSampleMeta = [], _ajaxPatientMeta = [],
      _ajaxSampleData = [], _ajaxPatientData = [],
      _ajaxPatient2SampleIdMappingObj = {}, _ajaxSample2PatientIdMappingObj = {},
      _ajaxMutationCountData = {}, _ajaxCnaFractionData = {},
      _ajaxGeneticProfiles = {}, _ajaxCnaData = {}, _ajaxMutGenesData = {},
      _sequencedSampleIds = [], _cnaSampleIds = [], _allSampleIds = [];

    function extractCaseLists(studyId, resp) {
      if (resp) {
        var _lists = resp.split('\n');
        for (var i = 0; i < _lists.length; i++) {
          var _parts = _lists[i].split('\t');
          if (_parts.length < 5) continue;
          if (_parts[0] === studyId + "_sequenced") {
            _sequencedSampleIds = _sequencedSampleIds.concat(_parts[4].trim().split(' '));
          } else if (_parts[0] === studyId + "_cna") {
            _cnaSampleIds = _cnaSampleIds.concat(_parts[4].trim().split(' '));
          } else if (_parts[0] === studyId + "_all") {
            _allSampleIds = _allSampleIds.concat(_parts[4].trim().split(' '));
          }
        }

        //For efficient comparing, see StudyViewUtil.intersection
        _allSampleIds = _allSampleIds.sort();
        _sequencedSampleIds = _sequencedSampleIds.sort();
        _cnaSampleIds = _cnaSampleIds.sort();

      }
    }

    /* 
     * Cascade of calling web APIs
     */

    // patient clinical attribute meta
    $.when.apply($, _studyIdArr.map(function (_studyId) {
      return $.ajax({
        method: "POST",
        url: PORTAL_INST_URL + '/api/clinicalattributes/patients',
        data: {study_id: _studyId}
      });
    })).done(function () {

      var _results = [];
      if (_studyIdArr.length === 1) {
        _results = arguments[0];
      } else {
        for (var i = 0; i < arguments.length; i++) {
          _results = _results.concat(arguments[i][0]);
        }
      }
      _ajaxPatientMeta = _ajaxPatientMeta.concat(_.uniq(_results, 'attr_id'));

      // sample clinical attribute meta
      $.when.apply($, _studyIdArr.map(function (_studyId) {
        return $.ajax({
          method: "POST",
          url: PORTAL_INST_URL + '/api/clinicalattributes/samples',
          data: {study_id: _studyId}
        });
      })).done(function () {
        var _results = [];
        if (_studyIdArr.length === 1) {
          _results = arguments[0];
        } else {
          for (var i = 0; i < arguments.length; i++) {
            _results = _results.concat(arguments[i][0]);
          }
        }
        _ajaxSampleMeta = _.uniq(_results, 'attr_id');

        // patient clinical data
        $.when.apply($, _studyIdArr.map(function (_studyId) {
          return $.ajax({
            method: "POST",
            url: PORTAL_INST_URL + '/api/clinicaldata/patients',
            data: {study_id: _studyId, attribute_ids: _.pluck(_ajaxPatientMeta, 'attr_id').join(',')}
          });
        })).done(function () {
          var _results = [];
          if (_studyIdArr.length === 1) {
            _results = arguments[0];
          } else {
            for (var i = 0; i < arguments.length; i++) {
              _results = _results.concat(arguments[i][0]);
            }
          }
          _ajaxPatientData = _results;

          // sample clinical data
          $.when.apply($, _studyIdArr.map(function (_studyId) {
            return $.ajax({
              method: "POST",
              url: PORTAL_INST_URL + '/api/clinicaldata/samples',
              data: {study_id: _studyId, attribute_ids: _.pluck(_ajaxSampleMeta, 'attr_id').join(',')}
            });
          })).done(function () {
            var _results = [];
            if (_studyIdArr.length === 1) {
              _results = arguments[0];
            } else {
              for (var i = 0; i < arguments.length; i++) {
                _results = _results.concat(arguments[i][0]);
              }
            }
            _ajaxSampleData = _results;
            $.when.apply($, _studyIdArr.map(function (_studyId) {
              return $.ajax({
                method: "POST",
                url: PORTAL_INST_URL + '/webservice.do?',
                data: {cmd: 'getCaseLists', cancer_study_id: _studyId}
              });
            })).done(function () {
              if (_studyIdArr.length === 1) {
                extractCaseLists(_studyIdArr[0], arguments[0])
              } else {
                for (var i = 0; i < arguments.length; i++) {
                  extractCaseLists(_studyIdArr[i], arguments[i][0])
                }
              }

              // patient id vs. sample id mapping (All ids under the studies, regardless of having data or not)
              $.when.apply($, _studyIdArr.map(function (_studyId) {
                return $.ajax({
                  method: "POST",
                  url: PORTAL_INST_URL + '/webservice.do?',
                  data: {cmd: 'getPatientSampleMapping', cancer_study_id: _studyId, case_set_id: _studyId + '_all'}
                });
              })).done(function () {
                if (_studyIdArr.length === 1) {
                  var tempMap_ = JSON.parse(arguments[0]);
                  var processedMap_ = {};
                  $.each(tempMap_, function (index, item) {
                    processedMap_[index] = {}
                    processedMap_[index].sample_ids = item;
                    processedMap_[index].study_id = _studyIdArr[0];
                  });
                  _ajaxPatient2SampleIdMappingObj = $.extend({}, processedMap_, _ajaxPatient2SampleIdMappingObj);
                } else {
                  for (var i = 0; i < arguments.length; i++) {
                    var tempMap_ = JSON.parse(arguments[i][0]);
                    var processedMap_ = {};
                    $.each(tempMap_, function (index, item) {
                      processedMap_[index] = {}
                      processedMap_[index].sample_ids = item;
                      processedMap_[index].study_id = _studyIdArr[i];
                    });
                    _ajaxPatient2SampleIdMappingObj = $.extend({}, processedMap_, _ajaxPatient2SampleIdMappingObj);
                  }
                }

                // get all genetic profiles for queried studies
                $.when.apply($, _studyIdArr.map(function (_studyId) {
                  return $.ajax({
                    method: "POST",
                    url: PORTAL_INST_URL + '/api/geneticprofiles',
                    data: {study_id: _studyId}
                  });
                })).done(function () {
                  var _results = [];
                  if (_studyIdArr.length === 1) {
                    _results = arguments[0];
                  } else {
                    for (var i = 0; i < arguments.length; i++) {
                      _results = _results.concat(arguments[i][0]);
                    }
                  }
                  _ajaxGeneticProfiles = _results;

                  // mutation count
                  var _mutCountStudyIdArr = _.filter(_studyIdArr, function (_studyId) {
                    return $.inArray(_studyId + '_mutations', _.pluck(_ajaxGeneticProfiles, 'id')) !== -1;
                  });
                  $.when.apply($, _mutCountStudyIdArr.map(function (_studyId) {
                    return $.ajax({
                      method: "POST",
                      url: PORTAL_INST_URL + '/mutations.json?',
                      data: {cmd: 'count_mutations', mutation_profile: _studyId + '_mutations'}
                    });
                  })).done(function () {
                    if (_mutCountStudyIdArr.length === 1) {
                      _ajaxMutationCountData = $.extend({}, arguments[0], _ajaxMutationCountData);
                    } else {
                      for (var i = 0; i < arguments.length; i++) {
                        _ajaxMutationCountData = $.extend({}, arguments[i][0], _ajaxMutationCountData);
                      }
                    }

                    // mutation data (for Mutated gene table)
                    var _mutDataStudyIdArr = _.filter(_studyIdArr, function (_studyId) {
                      return $.inArray(_studyId + '_mutations', _.pluck(_ajaxGeneticProfiles, 'id')) !== -1;
                    });
                    $.when.apply($, _mutDataStudyIdArr.map(function (_studyId) {
                      return $.ajax({
                        method: "POST",
                        url: PORTAL_INST_URL + '/mutations.json?',
                        data: {cmd: 'get_smg', mutation_profile: _studyId + '_mutations'}
                      });
                    })).done(function () {
                      _results = [];
                      if (_mutDataStudyIdArr.length === 1) {
                        _results = arguments[0];
                      } else {
                        for (var i = 0; i < arguments.length; i++) {
                          _results = _results.concat(arguments[i][0]);
                        }
                      }
                      _ajaxMutGenesData = _results;

                      // cna fraction data
                      $.when.apply($, _studyIdArr.map(function (_studyId) {
                        return $.ajax({
                          method: "POST",
                          url: PORTAL_INST_URL + '/cna.json?',
                          data: {cmd: 'get_cna_fraction', cancer_study_id: _studyId}
                        });
                      })).done(function () {
                        if (_studyIdArr.length === 1) {
                          _ajaxCnaFractionData = $.extend({}, arguments[0], _ajaxCnaFractionData);
                        } else {
                          for (var i = 0; i < arguments.length; i++) {
                            _ajaxCnaFractionData = $.extend({}, arguments[i][0], _ajaxCnaFractionData);
                          }
                        }

                        if(_.isObject(_ajaxCnaFractionData) && Object.keys(_ajaxCnaFractionData).length > 0){
                          _hasMutationCNAScatterPlotData = true;
                        }
                        
                        // cna data (for CNA table)
                        var _gisticStudyIdArr = _.filter(_studyIdArr, function (_studyId) {
                          return $.inArray(_studyId + '_gistic', _.pluck(_ajaxGeneticProfiles, 'id')) !== -1;
                        });
                        $.when.apply($, _gisticStudyIdArr.map(function (_studyId) {
                          return $.ajax({
                            method: "POST",
                            url: PORTAL_INST_URL + '/cna.json?',
                            data: {cbio_genes_filter: true, cna_profile: _studyId + "_gistic"}
                          });
                        })).done(function () {
                          _ajaxCnaData.gene = [];
                          _ajaxCnaData.gistic = [];
                          _ajaxCnaData.cytoband = [];
                          _ajaxCnaData.alter = [];
                          _ajaxCnaData.caseIds = [];
                          if (arguments.length !== 0) {
                            if (_studyIdArr.length === 1) {
                              _ajaxCnaData.gene = arguments[0].gene;
                              _ajaxCnaData.gistic = arguments[0].gistic;
                              _ajaxCnaData.cytoband = arguments[0].cytoband;
                              _ajaxCnaData.alter = arguments[0].alter;
                              _ajaxCnaData.caseIds = arguments[0].caseIds;
                            } else {
                              for (var i = 0; i < arguments.length; i++) {
                                _ajaxCnaData.gene = _ajaxCnaData.gene.concat(arguments[i][0].gene);
                                _ajaxCnaData.gistic = _ajaxCnaData.gistic.concat(arguments[i][0].gistic);
                                _ajaxCnaData.cytoband = _ajaxCnaData.cytoband.concat(arguments[i][0].cytoband);
                                _ajaxCnaData.alter = _ajaxCnaData.alter.concat(arguments[i][0].alter);
                                _ajaxCnaData.caseIds = _ajaxCnaData.caseIds.concat(arguments[i][0].caseIds);
                              }
                            }                            
                          }

                          /* 
                           * web API results converting 
                           */

                          var _patientData = [], _sampleData = {};
                          var _patientIdStudyIdMap = {}, _sampleIdStudyIdMap = {};
                          var _indexSample = 0, _sampleDataIndicesObj = {};
                          var _indexPatient = 0, _patientDataIndicesObj = {};
                          var _ajaxPatient2SampleIdMappingObjSimplified = {};

                          // map clinical data to each patient (key: patient ID, value: object of attributes vs. val)
                          var _patientIdToClinDataMap = {};
                          _.each(_ajaxPatientData, function(_dataObj) {
                            if (!_patientIdToClinDataMap.hasOwnProperty(_dataObj.patient_id)) {
                              _patientIdToClinDataMap[_dataObj.patient_id] = {};
                            }
                            _patientIdToClinDataMap[_dataObj.patient_id][_dataObj.attr_id] = _dataObj.attr_val;
                            if (_dataObj.attr_id === 'DFS_MONTHS' || _dataObj.attr_id === 'DFS_STATUS') {
                              _hasDFSSurvivalData = true;
                            } else if (_dataObj.attr_id === "OS_MONTHS" || _dataObj.attr_id === 'OS_STATUS') {
                              _hasOSSurvivalData = true;
                            } 
                          });

                          // map clinical data to each sample (key: sample ID, value: object of attributes vs. val)
                          var _sampleIdToClinDataMap = {};
                          _.each(_ajaxSampleData, function(_dataObj) {
                            if (!_sampleIdToClinDataMap.hasOwnProperty(_dataObj.sample_id)) {
                              _sampleIdToClinDataMap[_dataObj.sample_id] = {};
                            } 
                            _sampleIdToClinDataMap[_dataObj.sample_id][_dataObj.attr_id] = _dataObj.attr_val;
                          });

                          _.each(Object.keys(_ajaxPatient2SampleIdMappingObj), function (_patientId) {

                            var _sampleIdArr = _ajaxPatient2SampleIdMappingObj[_patientId]['sample_ids'];
                            var _studyId = _ajaxPatient2SampleIdMappingObj[_patientId]['study_id'];
                            
                            // construct patient id <-> study id hash map (key: patient id, val: study id)
                            _patientIdStudyIdMap[_patientId] = _studyId;
                            if (!_patientIdStudyIdMap.hasOwnProperty(_patientId)) {
                              _patientIdStudyIdMap[_patientId] = _studyId;
                            }
                            
                            _ajaxPatient2SampleIdMappingObjSimplified[_patientId] = _sampleIdArr;

                            // create datum for each patient
                            var _datumPatientClinData = {};
                            if (_patientIdToClinDataMap.hasOwnProperty(_patientId)) {
                              _datumPatientClinData = _patientIdToClinDataMap[_patientId];
                            }
                            _datumPatientClinData['patient_id'] = _patientId;
                            _datumPatientClinData['study_id'] = _studyId;
                            _patientData.push(_datumPatientClinData);
                            _patientDataIndicesObj[_patientId] = _indexPatient;
                            _indexPatient += 1;

                            _.each(_sampleIdArr, function (_sampleId) {

                              // construct sample id <-> study id hash map (key: sample id, val: study id)
                              if (!_sampleIdStudyIdMap.hasOwnProperty(_sampleId)) {
                                _sampleIdStudyIdMap[_sampleId] = _studyId;
                              }

                              // map from sample to patient
                              _ajaxSample2PatientIdMappingObj[_sampleId] = [_patientId];
                              
                              // create datum for each sample
                              var _datum = {};
                              if (_sampleIdToClinDataMap.hasOwnProperty(_sampleId)) {
                                _datum = _sampleIdToClinDataMap[_sampleId];
                              }
                              _datum['sample_id'] = _sampleId;
                              _datum['study_id'] = _studyId;

                              // indices
                              _sampleDataIndicesObj[_sampleId] = _indexSample;
                              _indexSample += 1;

                              // mutation count
                              if (_ajaxMutationCountData[_sampleId] === undefined || _ajaxMutationCountData[_sampleId] === null) {
                                _datum['mutation_count'] = 'NA';
                              } else {
                                _datum['mutation_count'] = _ajaxMutationCountData[_sampleId];
                              }

                              // cna fraction
                              if (_hasMutationCNAScatterPlotData) {
                                if (_ajaxCnaFractionData[_sampleId] === undefined || _ajaxCnaFractionData[_sampleId] === null) {
                                  _datum['cna_fraction'] = 0;
                                } else {
                                  _datum['cna_fraction'] = _ajaxCnaFractionData[_sampleId];
                                }                                
                              }

                              _sampleData[_sampleId]=_datum;
                            });
                          });

                          // extract mutation data
                          var _mutGeneMeta = {}, _mutGeneMetaIndex = 0;
                          _.each(_ajaxMutGenesData, function (_mutGeneDataObj) {
                            var _geneSymbol = _mutGeneDataObj.gene_symbol;
                            _.each(_mutGeneDataObj.caseIds, function (_caseId) {
                              if (_sampleIdStudyIdMap.hasOwnProperty(_caseId)) {
                                if (_mutGeneMeta.hasOwnProperty(_geneSymbol)) {
                                  _mutGeneMeta[_geneSymbol].num_muts += 1;
                                  _mutGeneMeta[_geneSymbol].caseIds.push(_caseId);
                                  if (_sampleData[_caseId].hasOwnProperty('mutated_genes')) {
                                    _sampleData[_caseId]['mutated_genes'].push(_mutGeneMeta[_geneSymbol].index)
                                  } else {
                                    _sampleData[_caseId]['mutated_genes'] = [_mutGeneMeta[_geneSymbol].index]
                                  }
                                } else {
                                  _mutGeneMeta[_geneSymbol] = {};
                                  _mutGeneMeta[_geneSymbol].gene = _geneSymbol;
                                  _mutGeneMeta[_geneSymbol].num_muts = 1;
                                  _mutGeneMeta[_geneSymbol].caseIds = [_caseId];
                                  _mutGeneMeta[_geneSymbol].qval = (_studyIdArr.length === 1 && _mutGeneDataObj.hasOwnProperty('qval')) ? _mutGeneDataObj.qval : null;
                                  _mutGeneMeta[_geneSymbol].index = _mutGeneMetaIndex;
                                  if (_sampleData[_caseId].hasOwnProperty('mutated_genes')) {
                                    _sampleData[_caseId]['mutated_genes'].push(_mutGeneMetaIndex)
                                  } else {
                                    _sampleData[_caseId]['mutated_genes'] = [_mutGeneMetaIndex]
                                  }
                                  _mutGeneMetaIndex += 1;
                                }
                              }
                            });
                          });

                          // extract cna data
                          var _cnaMeta = {}, _cnaMetaIndex = 0;
                          $.each(_ajaxCnaData.caseIds, function (_index, _caseIdsPerGene) {
                            var _geneSymbol = _ajaxCnaData.gene[_index];
                            _.each(_caseIdsPerGene, function (_caseId) {
                              if (_sampleIdStudyIdMap.hasOwnProperty(_caseId)) {
                                if (_cnaMeta.hasOwnProperty(_geneSymbol)) {
                                  _cnaMeta[_geneSymbol].caseIds.push(_caseId);
                                    if( _sampleData[_caseId].hasOwnProperty('cna_details')){
                                      _sampleData[_caseId]['cna_details'].push(_cnaMeta[_geneSymbol].index)
                                    }else{
                                      _sampleData[_caseId]['cna_details'] = [_cnaMeta[_geneSymbol].index]
                                    }
                                } else {
                                  _cnaMeta[_geneSymbol] = {};
                                  _cnaMeta[_geneSymbol].gene = _geneSymbol;
                                  var _altType = '';
                                  switch (_ajaxCnaData.alter[_index]) {
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
                                  _cnaMeta[_geneSymbol].cytoband = _ajaxCnaData.cytoband[_index];
                                  _cnaMeta[_geneSymbol].caseIds = [_caseId];
                                  if ((_studyIdArr.length !== 1) || _ajaxCnaData.gistic[_index] === null) {
                                    _cnaMeta[_geneSymbol].qval = null;
                                  } else {
                                    _cnaMeta[_geneSymbol].qval = _ajaxCnaData.gistic[_index][0];
                                  }
                                  _cnaMeta[_geneSymbol].index = _cnaMetaIndex;
                                    if( _sampleData[_caseId].hasOwnProperty('cna_details')){
                                      _sampleData[_caseId]['cna_details'].push(_cnaMetaIndex)
                                    }else{
                                      _sampleData[_caseId]['cna_details'] = [_cnaMetaIndex]
                                    }
                                  
                                  _cnaMetaIndex += 1;
                                }
                              }
                            });
                          });

                          // add mutation count 
                          if (_ajaxMutationCountData.length !== 0) {
                            var _MutationCountMeta = {};
                            _MutationCountMeta.datatype = 'NUMBER';
                            _MutationCountMeta.description = "Mutation Count";
                            _MutationCountMeta.display_name = "Mutation Count";
                            _MutationCountMeta.attr_id = "mutation_count";
                            _MutationCountMeta.view_type = 'bar_chart';
                            _ajaxSampleMeta.unshift(_MutationCountMeta);
                          }

                          // add CNA details
                          if (_gisticStudyIdArr.length !== 0) {
                            var _cnaAttrMeta = {};
                            _cnaAttrMeta.type = 'cna';
                            _cnaAttrMeta.view_type = 'table';
                            _cnaAttrMeta.display_name = 'Copy Number Alterations';
                            _cnaAttrMeta.description = 'Copy Number Alterations';
                            _cnaAttrMeta.gene_list = _cnaMeta;
                            _cnaAttrMeta.attr_id = 'cna_details';
                            _cnaAttrMeta.options = {
                              allCases: _allSampleIds,
                              sequencedCases: _cnaSampleIds.length > 0 ? _cnaSampleIds : _allSampleIds
                            }
                            _ajaxSampleMeta.unshift(_cnaAttrMeta);
                          }

                          // add Gene Mutation Info
                          if (_mutDataStudyIdArr.length !== 0) {
                            var _mutDataAttrMeta = {};
                            _mutDataAttrMeta.type = 'mutatedGene';
                            _mutDataAttrMeta.view_type = 'table';
                            _mutDataAttrMeta.display_name = 'Mutated Genes';
                            _mutDataAttrMeta.description = 'Mutated Genes';
                            _mutDataAttrMeta.gene_list = _mutGeneMeta;
                            _mutDataAttrMeta.attr_id = 'mutated_genes';
                            _mutDataAttrMeta.options = {
                              allCases: _allSampleIds,
                              sequencedCases: _sequencedSampleIds.length > 0 ? _sequencedSampleIds : _allSampleIds
                            }
                            _ajaxSampleMeta.unshift(_mutDataAttrMeta);
                          }

                          // add Mutation count vs. CNA fraction
                          if (_hasMutationCNAScatterPlotData) {
                            var _mutCntAttrMeta = {};
                            _mutCntAttrMeta.attr_id = 'MUT_CNT_VS_CNA';
                            _mutCntAttrMeta.datatype = 'SCATTER_PLOT';
                            _mutCntAttrMeta.view_type = 'scatter_plot';
                            _mutCntAttrMeta.description = 'Mutation Count vs. CNA';
                            _mutCntAttrMeta.display_name = 'Mutation Count vs. CNA';
                            _ajaxSampleMeta.unshift(_mutCntAttrMeta);                            
                          }

                          // add DFS survival
                          if (_hasDFSSurvivalData) {
                            var _dfsSurvivalAttrMeta = {};
                            _dfsSurvivalAttrMeta.attr_id = 'DFS_SURVIVAL';
                            _dfsSurvivalAttrMeta.datatype = 'SURVIVAL';
                            _dfsSurvivalAttrMeta.view_type = 'survival';
                            _dfsSurvivalAttrMeta.description = 'Disease Free Survival';
                            _dfsSurvivalAttrMeta.display_name = 'Disease Free Survival';
                            _ajaxPatientMeta.unshift(_dfsSurvivalAttrMeta);                            
                          }

                          // add OS survival
                          if (_hasOSSurvivalData) {
                            var _osSurvivalAttrMeta = {};
                            _osSurvivalAttrMeta.attr_id = 'OS_SURVIVAL';
                            _osSurvivalAttrMeta.datatype = 'SURVIVAL';
                            _osSurvivalAttrMeta.view_type = 'survival';
                            _osSurvivalAttrMeta.description = 'Overall Survival';
                            _osSurvivalAttrMeta.display_name = 'Overall Survival';
                            _ajaxPatientMeta.unshift(_osSurvivalAttrMeta);                            
                          }

                          // add Cancer Study
                          if (_studyIdArr.length > 1) {
                            _ajaxPatientMeta.unshift({
                              "datatype": "STRING",
                              "description": "Cancer Studies",
                              "display_name": "Cancer Studies",
                              "attr_id": "study_id",
                              "view_type": "pie_chart"
                            });                            
                          }

                          // TODO : temporary fix to show/hide charts
                          var tempCount = 0;
                          // define view type from data type
                          _.each(_ajaxSampleMeta, function (_metaObj) {
                            _metaObj.filter = [];
                            _metaObj.show = true;
                            if (_metaObj.datatype === "NUMBER") {
                              _metaObj.view_type = 'bar_chart';
                            } else if (_metaObj.datatype === "STRING") {
                              _metaObj.view_type = 'pie_chart';
                            }
                            tempCount++;
                          });
                          tempCount = 0;
                          _.each(_ajaxPatientMeta, function (_metaObj) {
                            _metaObj.filter = [];
                            _metaObj.show = true;
                            if (_metaObj.datatype === "NUMBER") {
                              _metaObj.view_type = 'bar_chart';
                            } else if (_metaObj.datatype === "STRING") {
                              _metaObj.view_type = 'pie_chart';
                            }
                            tempCount++;
                          });
                          var _sampleDataSimplified = [];
                          _.each(_sampleData,function(val,key){
                            _sampleDataSimplified.push(val)
                          });

                          _result.groups = {};
                          _result.groups.patient = {};
                          _result.groups.sample = {};
                          _result.groups.group_mapping = {};
                          _result.groups.patient.attr_meta = _ajaxPatientMeta;
                          _result.groups.sample.attr_meta = _ajaxSampleMeta;
                          _result.groups.patient.data = _patientData;
                          _result.groups.sample.data = _sampleDataSimplified;
                          _result.groups.patient.data_indices = {};
                          _result.groups.sample.data_indices = {};
                          _result.groups.patient.data_indices.patient_id = _patientDataIndicesObj;
                          _result.groups.sample.data_indices.sample_id = _sampleDataIndicesObj;
                          _result.groups.group_mapping.sample = {};
                          _result.groups.group_mapping.patient = {};
                          _result.groups.group_mapping.sample.patient = _ajaxSample2PatientIdMappingObj;
                          _result.groups.group_mapping.patient.sample = _ajaxPatient2SampleIdMappingObjSimplified;
                          
                          _callbackFunc(_result, _inputSampleList, _inputPatientList);

                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

  }
}(window.iViz, window.$));