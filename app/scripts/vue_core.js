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
  iViz.session = {};

  iViz.session.manage = (function() {
    var vmInstance;

    return {
      init: function() {
        vmInstance = new Vue({
          el: '#main-header',
          data: {
            showVCList: false,
            addNewVC: false,
            filters: [],
            selectedPatientsNum: 0,
            selectedSamplesNum: 0,
            virtualCohorts: []
          }, ready: function() {
            this.$watch('showVCList', function() {
              this.virtualCohorts = iViz.session.utils.getVirtualCohorts();
            });
          }
        });
      },
      getinstance: function() {
        if (typeof vmInstance === 'undefined') {
          this.init();
        }
        return vmInstance;
      }
    };
  })();

  //This is an example to add sample to a virtual cohort from scatter plot
  iViz.session.vmScatter = (function() {
    var vmInstance;

    return {
      init: function() {
        vmInstance = new Vue({
          el: '#scatter-container',
          data: {
            showList: false,
            virtualCohorts: null,
            sampleID: null,
            cancerStudyID: null,
            addNewVC: false
          }, ready: function() {
            this.$watch('showList', function() {
              this.virtualCohorts = iViz.session.utils.getVirtualCohorts();
            });
          }
        });
      },
      getinstance: function() {
        return vmInstance;
      }
    };
  })();
})(window.Vue, window.iViz);
