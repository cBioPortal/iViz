/**
 * Created by Karthik Kalletla on 4/18/16.
 */
'use strict';
(function(Vue) {
  Vue.component('breadCrumb', {
    template: '<span class="breadcrumb_container" ' +
    'v-if="attributes.filter.length > 0">' +
    '<span>{{attributes.display_name}}</span><span ' +
    'v-if="(filtersToSkipShowing.indexOf(attributes.attr_id) === -1) && ' +
    '(specialTables.indexOf(attributes.attr_id) === -1)" class="breadcrumb_items">' +
    '<span v-if="attributes.view_type===\'bar_chart\'">' +
    '<span v-if="filters[0]!==\'\' && filters[1]!==\'\'" class="breadcrumb_item">{{filters[0]}} ~ {{filters[1]}}</span>' +
    '<span v-if="filters[0]!==\'\' && filters[1]===\'\'" class="breadcrumb_item">{{filters[0]}}</span>' +
    '<span v-if="filters[0]===\'\' && filters[1]!==\'\'" class="breadcrumb_item">{{filters[1]}}</span>' +
    '<i class="fa fa-times breadcrumb_remove" @click="removeFilter()"></i>' +
    '</span>' +
    '<template v-else>' +
    '<span v-for="filter in filters" style="display:inline-block;">' +
    '<span class="breadcrumb_item">{{filter}}</span>' +
    '<i class="fa fa-times breadcrumb_remove" ' +
    '@click="removeFilter(filter)"></i></span></template></span>' +
    '<template v-else>' +
    '<i class="fa fa-times breadcrumb_remove" @click="removeFilter()"></i>' +
    '</template></span>',
    props: [
      'filters', 'attributes'
    ], data: function() {
      return {
        filtersToSkipShowing: ['MUT_CNT_VS_CNA', 'sample_uid', 'patient_uid'],
        specialTables: ['mutated_genes', 'cna_details']
      };
    },
    methods: {
      removeFilter: function(val) {
        if (this.attributes.view_type === 'bar_chart') {
          this.filters = [];
        } else if (this.attributes.view_type === 'pie_chart') {
          if (
            this.filtersToSkipShowing.indexOf(this.attributes.attr_id) === -1) {
            this.filters.$remove(val);
          } else {
            this.filters = [];
          }
        } else if (this.attributes.view_type === 'scatter_plot') {
          this.filters = [];
        } else if (this.attributes.view_type === 'table') {
          if (this.specialTables.indexOf(this.attributes.attr_id) === -1) {
            this.filters.$remove(val);
          } else {
            this.filters = [];
          }
        }
      }
    }
  });
})(window.Vue);
