/**
 * @author Yichao Sun on 5/18/16.
 */
'use strict';
(function(Vue, dc, iViz, _) {
  Vue.component('survival', {
    template: '<div id={{chartDivId}} ' +
    'class="grid-item grid-item-h-2 grid-item-w-2" ' +
    ':data-number="attributes.priority" @mouseenter="mouseEnter" ' +
    '@mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations" ' +
    ':has-chart-title="hasChartTitle" :display-name="displayName" ' +
    ':groupid="attributes.group_id" :reset-btn-id="resetBtnId" :chart-ctrl="chartInst" ' +
    ' :chart-id="chartId" ' +
    ':attributes="attributes"></chart-operations>' +
    '<div :class="{\'start-loading\': showLoad}" ' +
    'class="dc-chart dc-scatter-plot" align="center" ' +
    'style="float:none !important;" id={{chartId}} ></div>' +
    '<div id="chart-loader"  :class="{\'show-loading\': showLoad}" ' +
    'class="chart-loader" style="top: 30%; left: 30%; display: none;">' +
    '<img src="images/ajax-loader.gif" alt="loading"></div></div>',
    props: [
      'ndx', 'attributes'
    ],
    created: function() {
    },
    data: function() {
      return {
        chartDivId: 'chart-' +
        this.attributes.attr_id.replace(/\(|\)| /g, '') + '-div',
        resetBtnId: 'chart-' +
        this.attributes.attr_id.replace(/\(|\)| /g, '') + '-reset',
        chartId: 'chart-new-' + this.attributes.attr_id.replace(/\(|\)| /g, ''),
        displayName: this.attributes.display_name,
        chartInst: '',
        showOperations: false,
        fromWatch: false,
        fromFilter: false,
        hasChartTitle: true,
        showLoad: true,
        invisibleDimension: {}
      };
    },
    events: {
      'show-loader': function() {
        this.showLoad = true;
      },
      'update-special-charts': function() {
        var attrId =
          this.attributes.group_type === 'patient' ? 'patient_id' : 'sample_id';
        var _selectedCases =
          _.pluck(this.invisibleDimension.top(Infinity), attrId);
        this.chartInst.update(
          _selectedCases, this.chartId, this.attributes.attr_id);
        this.showLoad = false;
      },
      'closeChart': function() {
        this.invisibleDimension.dispose();
        this.$dispatch('close');
      },
      'addingChart': function(groupId, val) {
        if (this.attributes.group_id === groupId) {
          if (this.attributes.filter.length > 0) {
            if (val) {
              this.invisibleDimension.filterAll();
            } else {
              var filtersMap = {};
              _.each(this.attributes.filter, function(filter) {
                if (filtersMap[filter] === undefined) {
                  filtersMap[filter] = true;
                }
              });
              this.invisibleDimension.filterFunction(function(d) {
                return (filtersMap[d] !== undefined);
              });
            }
          }
        }
      }
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      }, mouseLeave: function() {
        this.showOperations = false;
      }
    },
    ready: function() {
      var _self = this;
      _self.showLoad = true;
      var attrId =
        this.attributes.group_type === 'patient' ? 'patient_id' : 'sample_id';
      this.invisibleDimension = this.ndx.dimension(function(d) {
        return d[attrId];
      });
      var _opts = {
        width: window.style.vars.survivalWidth,
        height: window.style.vars.survivalHeight,
        chartId: this.chartId,
        attrId: this.attributes.attr_id,
        title: this.attributes.display_name,
        type: this.attributes.group_type
      };
      _self.chartInst = new iViz.view.component.Survival();
      _self.chartInst.setDownloadDataTypes(['pdf', 'svg']);

      var data = iViz.getGroupNdx(this.attributes.group_id);
      _self.chartInst.init(data, _opts);
      _self.showLoad = false;
      this.$dispatch('data-loaded', this.attributes.group_id, this.chartDivId);
    }
  });
})(
  window.Vue,
  window.dc,
  window.iViz,
  window._
);
