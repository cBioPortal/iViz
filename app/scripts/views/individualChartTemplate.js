/**
 * Created by Karthik Kalletla on 4/6/16.
 */
'use strict';
(function(Vue) {
  Vue.component('individualChart', {
    template: '<component :is="currentView" v-if="attributes.show" :ndx="ndx" ' +
    ':attributes.sync="attributes"></component>',
    props: [
      'ndx', 'attributes'
    ],
    data: function() {
      var currentView = '';
      this.attributes.filter  =[];
      switch (this.attributes.view_type) {
        case 'pie_chart':
          currentView = 'pie-chart';
          break;
        case 'bar_chart':
          currentView = 'bar-chart';
          break;
        case 'scatter_plot':
          currentView = 'scatter-plot';
          break;
        case 'survival':
          currentView = 'survival';
          break;
        case 'table':
          currentView = 'table-view';
          break;
        default:
          currentView = 'pie-chart';
          break;
      }
      return {
        currentView: currentView
      };
    },
    events: {
      'close': function() {
        this.attributes.show = false;
        this.$dispatch('remove-chart',
          this.attributes.attr_id, this.attributes.group_id);
      },
      'clear-chart-filters': function() {
        var _self = this;
        if (_self.attributes.filter.length > 0) {
          _self.attributes.filter = [];
        }
      }
    }
  });
})(window.Vue);
