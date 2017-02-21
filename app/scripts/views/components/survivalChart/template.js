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
      'update-special-charts': function(hasFilters) {
        var _type = this.attributes.group_type;
        var attrId = _type === 'patient' ? 'patient_id' : 'sample_id';
        var _selectedCases = [];
        var _allCases = Object.keys(iViz.getCaseIndices(_type));
        var groups = [];

        if (hasFilters) {
          _selectedCases =
            _.pluck(this.invisibleDimension.top(Infinity), attrId);
        }

        if (_selectedCases.length === 0) {
          groups.push({
            caseIds: _allCases,
            curveHex: '#2986e2'
          });
        } else {
          groups = [{
            caseIds: _selectedCases,
            curveHex: 'red'
          }, {
            caseIds: _.difference(
              _allCases, _selectedCases),
            curveHex: '#2986e2'
          }];
        }

        groups = this.calcCurvesData(groups);

        // Display name may be changed due to the rainbow survival
        this.displayName = this.attributes.display_name;

        this.chartInst.update(
          groups, this.chartId, this.attributes.attr_id);
        this.showLoad = false;
        this.$dispatch('remove-rainbow-survival');
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
      },
      'create-rainbow-survival': function(opts) {
        opts.groups = this.calcCurvesData(
          opts.groups, opts.groupType);

        if (opts.subtitle) {
          this.displayName = this.attributes.display_name + opts.subtitle;
        }
        this.chartInst.update(
          opts.groups, this.chartId, this.attributes.attr_id);
      }
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      }, mouseLeave: function() {
        this.showOperations = false;
      },
      calcCurvesData: function(groups, groupType) {
        var data_ = iViz.getGroupNdx(this.attributes.group_id);
        var survivalType = this.attributes.group_type;
        _.each(groups, function(group) {
          group.data = [];

          // If group type is sample, need to convert sample ID to patient ID.
          if (groupType === 'sample') {
            group.caseIds = iViz.util.idMapping(iViz.getCasesMap('sample'),
              group.caseIds);
          }
          _.each(group.caseIds, function(id) {
            var _index = iViz.getCaseIndices(survivalType)[id];
            group.data.push(data_[_index]);
          });
        });
        return groups;
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
        width: window.iViz.styles.vars.survival.width,
        height: window.iViz.styles.vars.survival.height,
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
