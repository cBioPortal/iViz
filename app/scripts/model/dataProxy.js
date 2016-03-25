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
    var _sampleData = [], _patientData = [], _sampleMeta = [], _patientMeta = [];
  
    // ajax calls
    $.post(PORTAL_INST_URL + '/api/clinicalattributes/patients', {study_id: 'ucec_tcga_pub'}, function(_clinAttrMetaUcecPatient) {
      var _clinAttrIdsUcecPatient = _.pluck(_clinAttrMetaUcecPatient, 'attr_id');
      $.post(PORTAL_INST_URL + '/api/clinicaldata/patients', {study_id: 'ucec_tcga_pub', attribute_ids: _clinAttrIdsUcecPatient.join(',')}, function(_clinDataUcecPatient) {
        $.post(PORTAL_INST_URL + '/api/clinicalattributes/samples', {study_id: 'ucec_tcga_pub'}, function(_clinAttrMetaUcecSample) {
          var _clinAttrIdsUcecSample = _.pluck(_clinAttrMetaUcecSample, 'attr_id');
          $.post(PORTAL_INST_URL + '/api/clinicaldata/samples', {study_id: 'ucec_tcga_pub', attribute_ids: _clinAttrIdsUcecSample.join(',')}, function(_clinDataUcecSample) {
            $.post(PORTAL_INST_URL + '/api/clinicalattributes/patients', {study_id: 'ov_tcga_pub'}, function(_clinAttrMetaOvPatient) {
              var _clinAttrIdsOvPatient = _.pluck(_clinAttrMetaOvPatient, 'attr_id');
              $.post(PORTAL_INST_URL + '/api/clinicaldata/patients', {study_id: 'ov_tcga_pub', attribute_ids: _clinAttrIdsOvPatient.join(',')}, function(_clinDataOvPatient) {
                $.post(PORTAL_INST_URL + '/api/clinicalattributes/samples', {study_id: 'ov_tcga_pub'}, function(_clinAttrMetaOvSample) {
                  var _clinAttrIdsUOvSample = _.pluck(_clinAttrMetaOvSample, 'attr_id');
                  $.post(PORTAL_INST_URL + '/api/clinicaldata/samples', {study_id: 'ov_tcga_pub', attribute_ids: _clinAttrIdsUOvSample.join(',')}, function(_clinDataOvSample) {
                    _sampleData = _.union(_clinDataUcecSample, _clinDataOvSample);
                    _patientData = _.union(_clinDataUcecPatient, _clinDataOvPatient);
                    _sampleMeta = _.uniq(_.union(_clinAttrMetaUcecSample, _clinAttrMetaOvSample), 'attr_id');
                    _patientMeta = _.uniq(_.union(_clinAttrMetaUcecPatient, _clinAttrMetaOvPatient), 'attr_id');
                  }, "json");
                }, "json");
              }, "json");
            }, "json");
          }, "json");
        }, "json");
      }, "json");
    }, "json");
    
    // converting web API results
    _result.groups.patient.attr_meta = _patientMeta;
    _result.groups.sample.attr_meta = _sampleMeta;
  
  }
}(window.iViz, window.$));