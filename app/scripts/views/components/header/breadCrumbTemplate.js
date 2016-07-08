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
 * Created by Karthik Kalletla on 4/18/16.
 */
'use strict';
(function(Vue) {
  Vue.component('breadCrumb', {
    template: 
      '<span class="breadcrumb_container" v-if="attributes.filter.length > 0">' +
        '<span>{{attributes.display_name}}</span>' +
        '<span v-if="(attributes.attr_id !== \'MUT_CNT_VS_CNA\')&&(attributes.view_type ! == \'table\')" class="breadcrumb_items">' +
          '<span v-if="filters.filterType === \'RangedFilter\'">' +
            '<span class="breadcrumb_item">{{filters[0]}} -- {{filters[1]}}</span>' +
            '<img class="breadcrumb_remove" src="../../../../images/remove_breadcrumb_icon.png" @click="removeFilter(filters)">' +
          '</span>' +
          '<template v-else>' +
            '<span v-for="filter in filters" style="display:inline-block;">' +
              '<span v-if="attributes.view_type === \'table\'"  class="breadcrumb_item">{{filter.uniqueId}}</span>' +
              '<span v-else class="breadcrumb_item">{{filter}}</span>' +
              '<img class="breadcrumb_remove" src="../../../../images/remove_breadcrumb_icon.png" @click="removeFilter(filter)">' +
            '</span>' +
          '</template>' +
        '</span>' +
        '<template v-else>' +
          '<img class="breadcrumb_remove" src="../../../../images/remove_breadcrumb_icon.png" @click="removeFilter()">' +
        '</template>' +
      '</span>',
    props: [
      'filters', 'attributes'
    ],
    watch: {
      'filters': function(val) {
      }
    },
    methods: {
      removeFilter: function(val) {
        if (this.attributes.view_type === 'bar_chart') {
          this.filters = [];
        } else if(this.attributes.view_type === 'pie_chart'){
          this.filters.$remove(val);
        } else if(this.attributes.view_type === 'scatter_plot'){
          this.filters = [];
        }else if(this.attributes.view_type === 'table'){
          this.filters = [];
        /*  var filters_ = $.extend(true,[],this.filters);
          filters_ = _.reject(filters_, function(el) { return el.uniqueId === val.uniqueId; });
          this.filters = filters_;*/
        }
      }
    }
  });
})(window.Vue);
