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
  Vue.component('listModal', {
    // template: '#list-modal-template',
    template: '<div class="modal-mask" v-show="show" transition="modal"' +
    ' @click="show = false"><div class="modal-list-container" @click.stop><ul' +
    ' class="vc-list-group"><li class="vc-list-group-item" v-for="value in' +
    ' vclist"><div v-on:click="addToVC(value.virtualCohortID)"' +
    ' class="vc-list-content">{{ value.studyName }}</div></li><li' +
    ' class="vc-list-group-item"><div v-on:click="addNewVC()"' +
    ' class="vc-list-content">Add to New Virtual' +
    ' Cohort</div></li></ul></div></div><add-vc :add-new-vc.sync="showPopup"' +
    ' :selected-patients-num=0 :from-iViz="false"' +
    ' :selected-samples-num=1' +
    ' :cancer-study-id="cancerStudyId" :sample="sample"></add-vc>',
    props: {
      show: {
        type: Boolean,
        required: true,
        twoWay: true
      },
      vclist: {
        type: Array
      },
      sample: {
        type: String
      },
      cancerStudyId: {
        type: String
      },
      showPopup: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      close: function() {
        this.show = false;
      },
      addToVC: function(virtualCohortID) {
        var _message = iViz.session.events.addSampleToVirtualCohort(
          virtualCohortID,
          this.cancerStudyId, this.sample);
        var msgToShow = 'Error while adding sample';
        if (_message === 'success') {
          msgToShow = 'Added sample Virtual Study';
        } else if (_message === 'warn') {
          msgToShow = 'Sample already present is Virtual Study';
        }
        jQuery.notify(msgToShow, _message);
        this.close();
      },
      addNewVC: function() {
        this.showPopup = true;
        this.close();
      }
    },
    ready: function() {
      var _this = this;
      document.addEventListener('keydown', function(e) {
        if (_this.show && e.keyCode === 27) {
          _this.close();
        }
      });
    }
  });
})(window.Vue, window.iViz);
