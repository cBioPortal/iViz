/**
 * Created by Karthik Kalletla on 4/6/16.
 */
'use strict';
(function(Vue, dc, iViz, $, _) {
  Vue.component('pieChart', {
    template: '<div id={{chartDivId}} ' +
    'class="grid-item grid-item-h-1 grid-item-w-1" ' +
    ':data-number="attributes.priority" ' +
    '@mouseenter="mouseEnter($event)" @mouseleave="mouseLeave($event)">' +
    '<chart-operations :has-chart-title="hasChartTitle" ' +
    ':display-name="displayName" :show-table-icon.sync="showTableIcon" ' +
    ' :show-pie-icon.sync="showPieIcon" :chart-id="chartId" ' +
    ':show-operations="showOperations" :groupid="attributes.group_id" ' +
    ':show-survival-icon.sync="showSurvivalIcon"' +
    ':reset-btn-id="resetBtnId" :chart-ctrl="piechart" ' +
    ' :filters.sync="attributes.filter" ' +
    ':attributes="attributes"></chart-operations>' +
    '<div class="dc-chart dc-pie-chart" ' +
    ':class="{view: showPieIcon}" align="center" style="float:none' +
    ' !important;" id={{chartId}} ></div>' +
    '<div id={{chartTableId}} :class="{view: showTableIcon}"></div>' +
    '</div>',
    props: [
      'ndx', 'attributes', 'showedSurvivalPlot'
    ],
    data: function() {
      return {
        v: {},
        chartDivId: 'chart-' +
        iViz.util.escape(this.attributes.attr_id) + '-div',
        resetBtnId: 'chart-' +
        iViz.util.escape(this.attributes.attr_id) + '-reset',
        chartId: 'chart-' + iViz.util.escape(this.attributes.attr_id),
        chartTableId: 'table-' + iViz.util.escape(this.attributes.attr_id),
        displayName: this.attributes.display_name,
        chartInst: '',
        component: '',
        showOperations: false,
        cluster: '',
        piechart: {},
        hasChartTitle: true,
        showTableIcon: true,
        showPieIcon: false,
        filtersUpdated: false,
        addingChart: false,
        numOfSurvivalCurveLimit: iViz.opts.numOfSurvivalCurveLimit || 20,
        showSurvivalIcon: false
      };
    },
    watch: {
      'attributes.filter': function(newVal) {
        if (this.filtersUpdated) {
          this.filtersUpdated = false;
        } else {
          this.filtersUpdated = true;
          if (newVal.length === 0) {
            this.chartInst.filterAll();
          } else {
            this.chartInst.replaceFilter([newVal]);
          }
          this.$dispatch('update-filters', true);
        }
      },
      'showedSurvivalPlot': function() {
        this.updateShowSurvivalIcon();
      }
    },
    events: {
      toTableView: function() {
        this.piechart.changeView(this, !this.showTableIcon);
      },
      closeChart: function() {
        $('#' + this.chartDivId).qtip('destroy');
        dc.deregisterChart(this.chartInst, this.attributes.group_id);
        this.chartInst.dimension().dispose();
        this.$dispatch('close');
      },
      addingChart: function(groupId, val) {
        if (this.attributes.group_id === groupId) {
          if (this.attributes.filter.length > 0) {
            if (val) {
              this.addingChart = val;
              this.chartInst.filter(null);
            } else {
              this.chartInst.filter([this.attributes.filter]);
              this.addingChart = val;
            }
          }
        }
      },
      getRainbowSurvival: function() {
        var groups = [];
        var categories = this.piechart.getCurrentCategories('key');
        var dataForCategories = iViz.util.getCaseIdsGroupByCategories(
          this.attributes.group_type,
          this.chartInst.dimension(),
          this.attributes.attr_id
        );
        _.each(categories, function(category) {
          if (dataForCategories.hasOwnProperty(category.name) &&
            // Remove pie chart NA group by default
            category.name !== 'NA') {
            groups.push({
              name: category.name,
              caseIds: dataForCategories[category.name],
              curveHex: category.color
            });
          }
        });
        this.$dispatch('create-rainbow-survival', {
          attrId: this.attributes.attr_id,
          subtitle: ' (' + this.attributes.display_name + ')',
          groups: groups,
          groupType: this.attributes.group_type
        });
      }
    },
    methods: {
      updateShowSurvivalIcon: function() {
        if (this.showedSurvivalPlot &&
          this.piechart.getCurrentCategories().length >= 2 &&
          this.piechart.getCurrentCategories().length <= this.numOfSurvivalCurveLimit) {
          this.showSurvivalIcon = true;
        } else {
          this.showSurvivalIcon = false;
        }
      },
      mouseEnter: function() {
        this.showOperations = true;
        this.$emit('initMainDivQtip');
      }, mouseLeave: function(event) {
        if (event.relatedTarget === null) {
          this.showOperations = false;
        }
        if ((event.relatedTarget !== null) &&
          (event.relatedTarget.nodeName !== 'CANVAS')) {
          this.showOperations = false;
        }
      }, initMainDivQtip: function() {
        this.piechart.initMainDivQtip();
      }
    },
    ready: function() {
      var _self = this;
      var _attrId = _self.attributes.attr_id;
      var _cluster = _self.ndx.dimension(function(d) {
        if (typeof d[_attrId] === 'undefined') {
          d[_attrId] = 'NA';
        }
        return d[_attrId];
      });

      _self.$once('initMainDivQtip', _self.initMainDivQtip);
      var opts = {
        chartId: _self.chartId,
        chartDivId: _self.chartDivId,
        groupid: _self.attributes.group_id,
        chartTableId: _self.chartTableId,
        transitionDuration: iViz.opts.dc.transitionDuration,
        width: window.iViz.styles.vars.piechart.width,
        height: window.iViz.styles.vars.piechart.height
      };
      _self.piechart = new iViz.view.component.PieChart(
        _self.ndx, _self.attributes, opts, _cluster);
      _self.piechart.setDownloadDataTypes(['tsv', 'pdf', 'svg']);
      _self.chartInst = _self.piechart.getChart();
      _self.chartInst.on('filtered', function(_chartInst, _filter) {
        if (!_self.addingChart) {
          if (_self.filtersUpdated) {
            _self.filtersUpdated = false;
          } else {
            _self.filtersUpdated = true;

            if (_filter === null) {
              _self.attributes.filter = [];
            } else if ($.inArray(_filter, _self.attributes.filter) === -1) {
              _self.attributes.filter.push(_filter);
            } else {
              _self.attributes.filter = _.filter(_self.attributes.filter, function(d) {
                return d !== _filter;
              });
            }
            _self.$dispatch('update-filters');
          }
          // Trigger pie chart filtered event.
          _self.piechart.filtered();
        }
      });

      _self.updateShowSurvivalIcon();
      _self.$dispatch('data-loaded', this.attributes.group_id, this.chartDivId);
    }
  });
})(
  window.Vue,
  window.dc,
  window.iViz,
  window.$ || window.jQuery, window._);