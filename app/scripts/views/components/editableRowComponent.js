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
 * Created by Karthik Kalletla on 3/16/16.
 */

'use strict';
(function(Vue, iViz) {
  Vue.component('editableRow', {
    // template: '#editable-row',
    template: '<tr><td class="text center" ><editable-field' +
    ' :name.sync="data.studyName" :edit="edit" type="text"/></td><td' +
    ' class="text center" ><editable-field :name.sync="data.description"' +
    ' :edit="edit" type="textarea"/></td><td class="text center"' +
    ' ><span>{{data.patientsLength}}</span></td><td class="text center"' +
    ' ><span>{{data.samplesLength}}</span></td><td><div class="buttons"' +
    ' :class="{view: !edit}"><button class="btn btn-info"' +
    ' @click="clickSave(data)"><em class="fa fa-save"></em></button><button' +
    ' class="btn btn-default" @click="clickCancel()"><em class="fa' +
    ' fa-times"></em></button></div><div class="buttons" :class="{view:' +
    ' edit}"><button class="btn btn-info"  @click="clickEdit(data)"><em' +
    ' class="fa fa-pencil"></em></button><button class="btn btn-danger"' +
    ' @click="clickDelete(data)"><em class="fa' +
    ' fa-trash"></em></button><button class="btn btn-success"><em class="fa' +
    ' fa-share-alt"></em></button><button class="btn btn-default"><em' +
    ' class="fa fa-filter" @click="clickImport()"></em></button></div></td></tr>',
    props: [
      'data'
    ],
    data: function() {
      return {
        edit: false
      };
    },
    methods: {
      clickEdit: function(_virtualStudy) {
        this.backupName = _virtualStudy.studyName;
        this.backupDesc = _virtualStudy.description;
        this.edit = true;
      },
      clickCancel: function() {
        if (this.edit) {
          this.data.studyName = this.backupName;
          this.data.description = this.backupDesc;
        }
        this.edit = false;
      },
      clickDelete: function(_virtualStudy) {
        iViz.session.events.removeVirtualCohort(_virtualStudy);
      },
      clickSave: function(_virtualStudy) {
        this.edit = false;
        if (_virtualStudy.studyName === '') {
          _virtualStudy.studyName = 'My virtual study';
        }
        iViz.session.events.editVirtualCohort(_virtualStudy);
      },
      clickImport: function() {
        //TODO: extract from local storage
        var _vc = {
          "studyName": "My Virtual Cohort",
          "description": "My virtual study - Description",
          "userID": "DEFAULT",
          "created": 1458599767140,
          "filters": {
            "patients": {
              "MENOPAUSE_STATUS": [
                "Post (prior bilateral ovariectomy OR >12 mo since LMP with no prior hysterectomy)"
              ]
            },
            "samples": {
              "OCT_EMBEDDED": [
                "true"
              ],
              "IS_FFPE": [
                "NO"
              ],
              "BCR_SAMPLE_UUID": [
                "NA",
                "b5206087-88de-4963-9239-189d159f7b35",
                "f2b59490-86fe-409a-89f1-e11f744e0d75",
                "1cb12a0f-0081-441f-a86e-71d76ef5b8d0",
                "7f4344cf-a5d7-4623-abe8-9f046723ea0a",
                "812485e9-fbb8-431b-8c49-d2f1a9391457",
                "a03f9020-3ded-4c1c-bf7e-1fa3a47e76de"
              ]
            }
          },
          "samplesLength": 14,
          "patientsLength": 14,
          "selectedCases": [
            {
              "studyID": "ucec_tcga",
              "samples": [
                "TCGA-AP-A1DK-01",
                "TCGA-AP-A1DM-01",
                "TCGA-AP-A1DO-01",
                "TCGA-AP-A1DP-01",
                "TCGA-AP-A1DQ-01",
                "TCGA-AP-A1DV-01"
              ],
              "patients": [
                "TCGA-AP-A1DK",
                "TCGA-AP-A1DM",
                "TCGA-AP-A1DO",
                "TCGA-AP-A1DP",
                "TCGA-AP-A1DQ",
                "TCGA-AP-A1DV"
              ]
            },
            {
              "studyID": "ucs_tcga",
              "samples": [
                "TCGA-N5-A4R8-01",
                "TCGA-N5-A4RA-01",
                "TCGA-N5-A4RJ-01",
                "TCGA-N5-A4RM-01",
                "TCGA-N5-A4RN-01",
                "TCGA-N5-A4RO-01",
                "TCGA-N5-A4RS-01",
                "TCGA-N6-A4VC-01"
              ],
              "patients": [
                "TCGA-N5-A4R8",
                "TCGA-N5-A4RA",
                "TCGA-N5-A4RJ",
                "TCGA-N5-A4RM",
                "TCGA-N5-A4RN",
                "TCGA-N5-A4RO",
                "TCGA-N5-A4RS",
                "TCGA-N6-A4VC"
              ]
            }
          ],
          "virtualCohortID": "56f07757d4c6f6e7dca130b0"
        }
        iViz.applyVC(_vc);
      }
    }
  });
})(window.Vue, window.iViz);
