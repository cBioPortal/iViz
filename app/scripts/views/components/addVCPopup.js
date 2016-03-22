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
 * Created by Karthik Kalletla on 3/21/16.
 */

'use strict';
(function(Vue, iViz) {
  Vue.component('addVc', {

    props: ['addNewVc', 'fromIViz', 'selectedSamplesNum', 'selectedPatientsNum',
      'name',
      'description', 'cancerStudyId', 'sample'],
    template: '<modaltemplate :show.sync="addNewVc" size="modal-lg"><div' +
    ' slot="header"><h3 class="modal-title">Save Virtual' +
    ' Cohorts</h3></div><div slot="body"><div' +
    ' class="form-group"><label>Number of Samples' +
    ' :&nbsp;</label><span>{{selectedSamplesNum}}</span></div><br><div' +
    ' class="form-group"><label>Number of Patients' +
    ' :&nbsp;</label><span>{{selectedPatientsNum}}</span></div><br><div' +
    ' class="form-group"><label for="name">Name:</label><input type="text"' +
    ' class="form-control" v-model="name"  placeholder="My Virtual Cohort"' +
    ' value="My Virtual Cohort"></div><br><div class="form-group"><label' +
    ' for="description">Decription:</label><textarea class="form-control"' +
    ' rows="4" cols="50" v-model="description"></textarea></div></div><div' +
    ' slot="footer"><button type="button" class="btn btn-default"' +
    ' @click="addNewVc = false">Cancel</button><button type="button"' +
    ' class="btn' +
    ' btn-default"@click="saveCohort()">Save</button></div></modaltemplate>',
    methods: {
      saveCohort: function() {
        var stats = {};
        if (this.fromIViz) {
          stats = iViz.stat();
        } else {
          var _selectedCases = iViz.session.utils.buildCaseListObject(
            this.cancerStudyId,
            this.sample);
          stats.filters = {};
          stats.selected_cases = _selectedCases;
        }
        iViz.session.events.saveCohort(stats,
          this.selectedPatientsNum, this.selectedSamplesNum, null, this.name,
          this.description || '');
        this.addNewVc = false;
        jQuery.notify('Added to new Virtual Study', 'success');
      }
    }
  });
})(window.Vue, window.iViz);
