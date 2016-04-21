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
 * Created by Karthik Kalletla on 4/14/16.
 */
'use strict';
(function(Vue, iViz, $) {
  Vue.component('chartOperations', {
    template: '<div class="chart-header"' +
    ' :class="{view:!showOperations}"><table id="tab"><tr><td><i class="fa' +
    ' fa-refresh dc-chart-pointer" aria-hidden="true"' +
    ' @click="reset()"></i></td><td><i style="margin-left:2px;" class="fa' +
    ' fa-arrows dc-chart-drag"></i></td><td><i class="fa fa-times' +
    ' dc-chart-pointer" @click="close()"></i></td></tr></table>' +
    '</div>',
    props: [
      'showOperations', 'resetBtnId', 'chart', 'groupid'
    ],
    methods: {
      reset: function() {
        iViz.shared.resetAll(this.chart, this.groupid)
      },
      close: function() {
        if (this.chart.hasFilter()) {
          iViz.shared.resetAll(this.chart, this.groupid)
        }
        dc.deregisterChart(this.chart, this.groupid);
        this.$dispatch('close')
      }
    }
  });
})(window.Vue, window.iViz,
  window.$ || window.jQuery);
