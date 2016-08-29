/**
 * Created by Karthik Kalletla on 4/20/16.
 */
'use strict';
(function(Vue, iViz, $) {
  Vue.component('manageCharts', {
    template: '<option id="{{data.attr_id}}" v-if="!data.show" ' +
    'value="{{data.attr_id}}">{{data.display_name}}</option>',
    props: [
      'data'
    ], ready: function() {
      $('#iviz-add-chart').trigger('chosen:updated');
    }
  });
})(
  window.Vue,
  window.iViz,
  window.$ || window.jQuery
);
