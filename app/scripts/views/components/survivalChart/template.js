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
    ':show-download-icon.sync="showDownloadIcon" ' +
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
        chartInst: {},
        showOperations: false,
        fromWatch: false,
        fromFilter: false,
        hasChartTitle: true,
        showLoad: true,
        showDownloadIcon: false,
        invisibleDimension: {},
        mainDivQtip: ''
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
            id: 0,
            caseIds: _allCases,
            curveHex: '#2986e2',
            name: 'All Patients'
          });
        } else {
          groups = [{
            id: 0,
            caseIds: _selectedCases,
            curveHex: 'red',
            name: 'Selected Patients'
          }, {
            id: 1,
            caseIds: _.difference(
              _allCases, _selectedCases),
            curveHex: '#2986e2',
            name: 'Unselected Patients'
          }];
        }

        groups = this.calcCurvesData(groups, _type);

        // Display name may be changed due to the rainbow survival
        this.displayName = this.attributes.display_name;

        this.chartInst.update(
          groups, this.chartId, this.attributes.attr_id);
        this.checkDownloadableStatus();
        this.showLoad = false;
        this.updateQtipContent();
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
        var _opts = $.extend(true, {}, opts);
        _opts.groups = this.calcCurvesData(
          _opts.groups, _opts.groupType);

        if (_opts.subtitle) {
          this.displayName = this.attributes.display_name + _opts.subtitle;
        }
        this.chartInst.update(
          _opts.groups, this.chartId, this.attributes.attr_id);
        this.checkDownloadableStatus();
        this.updateQtipContent();
      }
    },
    methods: {
      updateQtipContent: function() {
        if (this.mainDivQtip) {
          var qtipContent = ['<div>'];
          var groups = this.chartInst.getGroups();
          _.each(groups, function(group) {
            qtipContent.push(
              '<div class="category-item" curve-id="' + group.id + '">' +
              '<svg width="12" height="12">' +
              '<rect height="12" width="12" fill="' +
              group.curveHex + '"></rect>' +
              '</svg><span>' + group.name + '</span></div>');
          });
          qtipContent.push('</div>');
          this.mainDivQtip.qtip('api').set('content.text', qtipContent.join(''));
          if (_.isArray(groups) && groups.length > 0) {
            this.mainDivQtip.qtip('api').disable(false);
          } else {
            this.mainDivQtip.qtip('api').disable(true);
          }
        }
      },
      mouseEnter: function() {
        this.showOperations = true;
        this.$emit('initMainDivQtip');
      }, mouseLeave: function() {
        this.showOperations = false;
      },
      calcCurvesData: function(groups, groupType) {
        var data_ = iViz.getGroupNdx(this.attributes.group_id);
        var survivalType = this.attributes.group_type;
        _.each(groups, function(group, index) {
          group.id = index;
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
      },
      initMainDivQtip: function() {
        var self_ = this;
        var chartDivId = self_.chartDivId;
        self_.mainDivQtip = $('#' + chartDivId).qtip({
          id: chartDivId + '-qtip',
          style: {
            classes: 'qtip-light qtip-rounded qtip-shadow forceZindex qtip-max-width dc-survival-chart-qtip'
          },
          show: {event: 'mouseover', delay: 300, ready: true},
          hide: {fixed: true, delay: 300, event: 'mouseleave'},
          // hide: false,
          position: {
            my: 'left center',
            at: 'center right',
            viewport: $(window)
          },
          content: '<div>Loading...</div>',
          events: {
            show: function(event, api) {
              var tooltip = api.elements.tooltip;
              tooltip.find('.category-item').unbind('click');
              tooltip.find('.category-item').click(function() {
                var curveId = $(this).attr('curve-id');
                self_.chartInst.highlightCurve(curveId);
              });
            }
          }
        });
        self_.updateQtipContent();
      },
      checkDownloadableStatus: function() {
        if (this.chartInst.downloadIsEnabled()) {
          this.showDownloadIcon = true;
        } else {
          this.showDownloadIcon = false;
        }
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
      var _type = this.attributes.group_type;

      _self.chartInst = new iViz.view.component.Survival();
      _self.chartInst.setDownloadDataTypes(['pdf', 'svg']);

      var data = iViz.getGroupNdx(this.attributes.group_id);
      var groups = [{
        id: 0,
        name: 'All Patients',
        curveHex: '#2986e2',
        caseIds: Object.keys(iViz.getCaseIndices(_type))
      }];
      groups = this.calcCurvesData(groups, _type);

      _self.chartInst.init(groups, data, _opts);
      _self.checkDownloadableStatus();
      _self.showLoad = false;
      _self.$once('initMainDivQtip', _self.initMainDivQtip);
      this.$dispatch('data-loaded', this.attributes.group_id, this.chartDivId);
    }
  });
})(
  window.Vue,
  window.dc,
  window.iViz,
  window._
);
