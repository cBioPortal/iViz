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
 * @author suny1@mskcc.org on 3/15/16.
 */

'use strict';
(function(iViz, $) {
  iViz.data = {};
  iViz.data.init = function(_callbackFunc, _inputSampleList, _inputPatientList) {
  
    var _result = {};
    var PORTAL_INST_URL = 'http://localhost:8080/cbioportal';
    var _ajaxSampleMeta = [], _ajaxPatientMeta = [];
  
    $.when(
  
      $.ajax({
        method: "POST",
        url: PORTAL_INST_URL + '/api/clinicalattributes/patients',
        data: {study_id: 'ucec_tcga_pub'}
      }),
  
      $.ajax({
        method: "POST",
        url: PORTAL_INST_URL + '/api/clinicalattributes/patients',
        data: {study_id: 'ov_tcga_pub'}
      }),
  
      $.ajax({
        method: "POST",
        url: PORTAL_INST_URL + '/api/clinicalattributes/samples',
        data: {study_id: 'ucec_tcga_pub'}
      }),
  
      $.ajax({
        method: "POST",
        url: PORTAL_INST_URL + '/api/clinicalattributes/samples',
        data: {study_id: 'ov_tcga_pub'}
      })
        
    ).done(function(_clinAttrMetaUcecPatient, _clinAttrMetaOvPatient, _clinAttrMetaUcecSample, _clinAttrMetaOvSample) {
        
        var _clinAttrIdsUcecPatient = _.pluck(_clinAttrMetaUcecPatient[0], 'attr_id');
        var _clinAttrIdsUcecSample = _.pluck(_clinAttrMetaUcecSample[0], 'attr_id');
        var _clinAttrIdsOvPatient = _.pluck(_clinAttrMetaOvPatient[0], 'attr_id');
        var _clinAttrIdsOvSample = _.pluck(_clinAttrMetaOvSample[0], 'attr_id');
        
        $.when(
  
          $.ajax({
            method: "POST",
            url: PORTAL_INST_URL + '/api/clinicaldata/patients',
            data: {study_id: 'ucec_tcga_pub', attribute_ids: _clinAttrIdsUcecPatient.join(',')}
          }),
  
          $.ajax({
            method: "POST",
            url: PORTAL_INST_URL + '/api/clinicaldata/patients',
            data: {study_id: 'ov_tcga_pub', attribute_ids: _clinAttrIdsOvPatient.join(',')}
          }),
  
          $.ajax({
            method: "POST",
            url: PORTAL_INST_URL + '/api/clinicaldata/samples',
            data: {study_id: 'ucec_tcga_pub', attribute_ids: _clinAttrIdsUcecSample.join(',')}
          }),
  
          $.ajax({
            method: "POST",
            url: PORTAL_INST_URL + '/api/clinicaldata/samples',
            data: {study_id: 'ov_tcga_pub', attribute_ids: _clinAttrIdsOvSample.join(',')}
          }),
          
          $.ajax({
            method: "POST",
            url: PORTAL_INST_URL + '/webservice.do?',
            data: {cmd: 'getPatientSampleMapping', cancer_study_id: 'ucec_tcga_pub', case_set_id: 'ucec_tcga_pub_all'}
          }),
    
          $.ajax({
            method: "POST",
            url: PORTAL_INST_URL + '/webservice.do?',
            data: {cmd: 'getPatientSampleMapping', cancer_study_id: 'ov_tcga_pub', case_set_id: 'ov_tcga_pub_all'}
          })
          
        ).done(function(_clinDataUcecPatient, _clinDataOvPatient, _clinDataUcecSample, _clinDataOvSample, _ajaxIdMappingObjUcec, _ajaxIdMappingObjOv) {
    
            // add in study id as an attribute
            _ajaxPatientMeta.push({
              "datatype": "STRING",
              "description": "Cancer Types",
              "display_name": "Cancer Types",
              "attr_id": "study_id",
              "view_type": "pie_chart"
            });
            
            _ajaxSampleMeta = _ajaxSampleMeta.concat(_.uniq(_.union(_clinAttrMetaUcecSample[0], _clinAttrMetaOvSample[0]), 'attr_id'));
            _ajaxPatientMeta = _ajaxPatientMeta.concat(_.uniq(_.union(_clinAttrMetaUcecPatient[0], _clinAttrMetaOvPatient[0]), 'attr_id'));
           
            // define view type from data type
            _.each(_ajaxSampleMeta, function(_metaObj) {
              if (_metaObj.datatype === "NUMBER") {
                _metaObj.view_type = 'bar_chart';
              } else if (_metaObj.datatype === "STRING") {
                _metaObj.view_type = 'pie_chart';
              }
            });

            _.each(_ajaxPatientMeta, function(_metaObj) {
              if (_metaObj.datatype === "NUMBER") {
                _metaObj.view_type = 'bar_chart';
              } else if (_metaObj.datatype === "STRING") {
                _metaObj.view_type = 'pie_chart';
              }
            });

            // converting web API results
            var _jointSample2PatientMapping = {}, _jointPatient2SampleMapping = {};
            $.extend(_jointPatient2SampleMapping, _ajaxIdMappingObjUcec[0], _ajaxIdMappingObjOv[0]);
            var _jointSampleData = [];
            $.each([_clinDataUcecSample[0], _clinDataOvSample[0]], function(_index, _dataGroup) {
              var _sampleIds = _.uniq(_.pluck(_dataGroup, 'sample_id'));
              _.each(_sampleIds, function(_sampleId) {
                var _datum = {};
                _datum.study_id = (_index === 0) ? "ucec_tcga_pub" : "ov_tcga_pub";
                _datum.sample_id = _sampleId;
                _.each(_dataGroup, function(_dataObj) {
                  if (_dataObj['sample_id'] === _sampleId) {
                    _datum[_dataObj.attr_id] = _dataObj.attr_val;
                  }
                });
                _jointSample2PatientMapping[_sampleId] = [_sampleId.substring(0, _sampleId.length - 3)];
                _jointSampleData.push(_datum);
              });
            });
            var _jointPatientData = [];
            $.each([_clinDataUcecPatient[0], _clinDataOvPatient[0]], function(_index, _dataGroup) {
              var _patientIds = _.uniq(_.pluck(_dataGroup, 'patient_id'));
              _.each(_patientIds, function(_patientId) {
                var _datum = {};
                _datum.study_id = (_index === 0) ? "ucec_tcga_pub" : "ov_tcga_pub";
                _datum.patient_id = _patientId;
                _.each(_dataGroup, function(_dataObj) {
                  if (_dataObj['patient_id'] === _patientId) {
                    _datum[_dataObj.attr_id] = _dataObj.attr_val;
                  }
                });
                _jointPatientData.push(_datum);
              });
            });
            
            _result.groups = {};
            _result.groups.patient = {};
            _result.groups.sample = {};
            _result.groups.group_mapping = {};
            _result.groups.patient.attr_meta = _ajaxPatientMeta;
            _result.groups.sample.attr_meta = _ajaxSampleMeta;
            _result.groups.patient.data = _jointPatientData;
            _result.groups.sample.data = _jointSampleData;
            _result.groups.group_mapping.sample = {};
            _result.groups.group_mapping.patient = {};
            _result.groups.group_mapping.sample.patient = _jointSample2PatientMapping;
            _result.groups.group_mapping.patient.sample = _jointPatient2SampleMapping;
    
            _callbackFunc(_result, _inputSampleList, _inputPatientList);
            
        });

    });

    //// ajax calls
    //$.post(PORTAL_INST_URL + '/api/clinicalattributes/patients', {study_id: 'ucec_tcga_pub'}, function(_clinAttrMetaUcecPatient) {
    //  var _clinAttrIdsUcecPatient = _.pluck(_clinAttrMetaUcecPatient, 'attr_id');
    //  $.post(PORTAL_INST_URL + '/api/clinicaldata/patients', {study_id: 'ucec_tcga_pub', attribute_ids: _clinAttrIdsUcecPatient.join(',')}, function(_clinDataUcecPatient) {
    //    $.post(PORTAL_INST_URL + '/api/clinicalattributes/samples', {study_id: 'ucec_tcga_pub'}, function(_clinAttrMetaUcecSample) {
    //      var _clinAttrIdsUcecSample = _.pluck(_clinAttrMetaUcecSample, 'attr_id');
    //      $.post(PORTAL_INST_URL + '/api/clinicaldata/samples', {study_id: 'ucec_tcga_pub', attribute_ids: _clinAttrIdsUcecSample.join(',')}, function(_clinDataUcecSample) {
    //        $.post(PORTAL_INST_URL + '/api/clinicalattributes/patients', {study_id: 'ov_tcga_pub'}, function(_clinAttrMetaOvPatient) {
    //          var _clinAttrIdsOvPatient = _.pluck(_clinAttrMetaOvPatient, 'attr_id');
    //          $.post(PORTAL_INST_URL + '/api/clinicaldata/patients', {study_id: 'ov_tcga_pub', attribute_ids: _clinAttrIdsOvPatient.join(',')}, function(_clinDataOvPatient) {
    //            $.post(PORTAL_INST_URL + '/api/clinicalattributes/samples', {study_id: 'ov_tcga_pub'}, function(_clinAttrMetaOvSample) {
    //              var _clinAttrIdsUOvSample = _.pluck(_clinAttrMetaOvSample, 'attr_id');
    //              $.post(PORTAL_INST_URL + '/api/clinicaldata/samples', {study_id: 'ov_tcga_pub', attribute_ids: _clinAttrIdsUOvSample.join(',')}, function(_clinDataOvSample) {
    //                $.post(PORTAL_INST_URL + '/webservice.do?', {cmd: 'getPatientSampleMapping', cancer_study_id: 'ucec_tcga_pub', case_set_id: 'ucec_tcga_pub_all'}, function(_ajaxIdMappingObjUcec) {
    //                  $.post(PORTAL_INST_URL + '/webservice.do?', {cmd: 'getPatientSampleMapping', cancer_study_id: 'ov_tcga_pub', case_set_id: 'ov_tcga_pub_all'}, function(_ajaxIdMappingObjOv) {
    //
    //                    // add in study id as an attribute
    //                    _ajaxPatientMeta.push({
    //                      "datatype": "STRING",
    //                      "description": "Cancer Types",
    //                      "display_name": "Cancer Types",
    //                      "attr_id": "study_id",
    //                      "view_type": "pie_chart"
    //                    });
    //                    
    //                    _ajaxSampleMeta = _ajaxSampleMeta.concat(_.uniq(_.union(_clinAttrMetaUcecSample, _clinAttrMetaOvSample), 'attr_id'));
    //                    _ajaxPatientMeta = _ajaxPatientMeta.concat(_.uniq(_.union(_clinAttrMetaUcecPatient, _clinAttrMetaOvPatient), 'attr_id'));
    //                   
    //                    // define view type from data type
    //                    _.each(_ajaxSampleMeta, function(_metaObj) {
    //                      if (_metaObj.datatype === "NUMBER") {
    //                        _metaObj.view_type = 'bar_chart';
    //                      } else if (_metaObj.datatype === "STRING") {
    //                        _metaObj.view_type = 'pie_chart';
    //                      }
    //                    });
    //
    //                    _.each(_ajaxPatientMeta, function(_metaObj) {
    //                      if (_metaObj.datatype === "NUMBER") {
    //                        _metaObj.view_type = 'bar_chart';
    //                      } else if (_metaObj.datatype === "STRING") {
    //                        _metaObj.view_type = 'pie_chart';
    //                      }
    //                    });
    //  
    //                    // converting web API results
    //                    var _jointSample2PatientMapping = {}, _jointPatient2SampleMapping = {};
    //                    $.extend(_jointPatient2SampleMapping, _ajaxIdMappingObjUcec, _ajaxIdMappingObjOv);
    //                    var _jointSampleData = [];
    //                    $.each([_clinDataUcecSample, _clinDataOvSample], function(_index, _dataGroup) {
    //                      var _sampleIds = _.uniq(_.pluck(_dataGroup, 'sample_id'));
    //                      _.each(_sampleIds, function(_sampleId) {
    //                        var _datum = {};
    //                        _datum.study_id = (_index === 0) ? "ucec_tcga_pub" : "ov_tcga_pub";
    //                        _datum.sample_id = _sampleId;
    //                        _.each(_dataGroup, function(_dataObj) {
    //                          if (_dataObj['sample_id'] === _sampleId) {
    //                            _datum[_dataObj.attr_id] = _dataObj.attr_val;
    //                          }
    //                        });
    //                        _jointSample2PatientMapping[_sampleId] = [_sampleId.substring(0, _sampleId.length - 3)];
    //                        _jointSampleData.push(_datum);
    //                      });
    //                    });
    //                    var _jointPatientData = [];
    //                    $.each([_clinDataUcecPatient, _clinDataOvPatient], function(_index, _dataGroup) {
    //                      var _patientIds = _.uniq(_.pluck(_dataGroup, 'patient_id'));
    //                      _.each(_patientIds, function(_patientId) {
    //                        var _datum = {};
    //                        _datum.study_id = (_index === 0) ? "ucec_tcga_pub" : "ov_tcga_pub";
    //                        _datum.patient_id = _patientId;
    //                        _.each(_dataGroup, function(_dataObj) {
    //                          if (_dataObj['patient_id'] === _patientId) {
    //                            _datum[_dataObj.attr_id] = _dataObj.attr_val;
    //                          }
    //                        });
    //                        _jointPatientData.push(_datum);
    //                      });
    //                    });
    //                    
    //                    _result.groups = {};
    //                    _result.groups.patient = {};
    //                    _result.groups.sample = {};
    //                    _result.groups.group_mapping = {};
    //                    _result.groups.patient.attr_meta = _ajaxPatientMeta;
    //                    _result.groups.sample.attr_meta = _ajaxSampleMeta;
    //                    _result.groups.patient.data = _jointPatientData;
    //                    _result.groups.sample.data = _jointSampleData;
    //                    _result.groups.group_mapping.sample = {};
    //                    _result.groups.group_mapping.patient = {};
    //                    _result.groups.group_mapping.sample.patient = _jointSample2PatientMapping;
    //                    _result.groups.group_mapping.patient.sample = _jointPatient2SampleMapping;
    //                    
    //                    _callbackFunc(_result, _inputSampleList, _inputPatientList);
    //                  }, "json");
    //                }, "json");                    
    //              }, "json");
    //            }, "json");
    //          }, "json");
    //        }, "json");
    //      }, "json");
    //    }, "json");
    //  }, "json");
    //}, "json");

  
  }
}(window.iViz, window.$));