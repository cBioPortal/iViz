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
 *
 */
/**
 * Created by Karthik Kalletla on 4/6/16.
 */
'use strict';
(function(Vue, dc, iViz, $) {
  Vue.component('chartImplementation', {
    template: '<component :is="currentView" :filters.sync="filters" :options="options" :ndx="ndx" :attributes="attributes"></component>',
    props: [
      'data', 'ndx', 'attributes', 'filters'
    ], data: function() {
      var options = {};
      var currentView = '';
      switch (this.attributes.view_type) {
        case 'pie_chart':
          currentView = 'pie-chart';
          break;
        case 'bar_chart':
          currentView = 'bar-chart';
          var data_ = _.map(
            _.filter(_.pluck(this.data, this.attributes.attr_id), function(d) {
              return d !== 'NA';
            }), function(d) {
              return parseFloat(d);
            });
          options.min = d3.min(data_);
          options.max = d3.max(data_);
          break;
      }
      return {
        currentView: this.attributes.view_type === 'pie_chart' ? 'pie-chart' :
          'bar-chart',
        options: options,
      }
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
