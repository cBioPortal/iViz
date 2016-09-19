/**
 * Created by Karthik Kalletla on 4/14/16.
 */
'use strict';
(function(Vue, iViz, dc, $, _) {
  Vue.component('chartOperations', {
    template: '<div class="chart-header">' +
    '<div class="chart-title" ' +
    ':class="[showOperations?chartTitleActive:chartTitle]" ' +
    'v-if="hasChartTitle&&((showTableIcon===undefined)||showTableIcon)">' +
    '<span class="chart-title-span" id="{{chartId}}-title">{{displayName}}' +
    '</span></div>' +
    '<div :class="[showOperations?chartOperationsActive:chartOperations]">' +
    '<i v-show="hasFilters" class="fa fa-undo icon hover" ' +
    'aria-hidden="true" @click="reset()"></i>' +
    '<div style="float:left" v-if="showLogScale"></input style="float:left">' +
    '<input type="checkbox" value="" id="" ' +
    'class="bar-x-log" v-model="logChecked">' +
    '<span id="scale-span-{{chartId}}" ' +
    'style="float:left; font-size:10px; margin-right: 15px; color: grey">' +
    'Log Scale X</span></div>' +
    '<i v-if="showDespIcon && this.hasTitleTooltip()" ' +
    'class="fa fa-question-circle-o icon hover" ' +
    'id="{{chartId}}-description-icon"' +
    'aria-hidden="true"></i>' +
    '<i v-if="showTableIcon" class="fa fa-table icon hover" ' +
    'aria-hidden="true" @click="changeView()"></i>' +
    '<i v-if="showPieIcon" class="fa fa-pie-chart icon hover" ' +
    'aria-hidden="true" @click="changeView()"></i>' +
    '<img v-if="showSurvivalIcon" src="images/survival_icon.svg" ' +
    'class="icon hover"/>' +
    '<div id="{{chartId}}-download-icon-wrapper" class="download">' +
    '<i class="fa fa-download icon hover" alt="download" ' +
    'id="{{chartId}}-download"></i>' +
    '</div>' +
    '<i class="fa fa-arrows dc-chart-drag icon" aria-hidden="true"></i>' +
    '<div style="float:right"><i class="fa fa-times dc-chart-pointer icon" ' +
    '@click="close()"></i></div>' +
    '</div>' +
    '</div>',
    props: [
      'showOperations', 'resetBtnId', 'chartCtrl', 'groupid',
      'hasChartTitle', 'showTable', 'displayName', 'chartId', 'showPieIcon',
      'showTableIcon', 'showLogScale', 'showSurvivalIcon', 'filters',
      'titleTooltip', 'showDespIcon'
    ],
    data: function() {
      return {
        chartOperationsActive: 'chart-operations-active',
        chartOperations: 'chart-operations',
        chartTitle: 'chart-title',
        chartTitleActive: 'chart-title-active',
        logChecked: true,
        hasFilters: false
      };
    },
    watch: {
      logChecked: function(newVal) {
        this.reset();
        this.$dispatch('changeLogScale', newVal);
      }, filters: function(newVal) {
        this.hasFilters = newVal.length > 0;
      }
    },
    methods: {
      reset: function() {
        if (this.filters.length > 0) {
          this.filters = [];
        }
      },
      close: function() {
        if (this.filters && this.filters.length > 0) {
          this.filters = [];
        }
        var self_ = this;
        self_.$nextTick(function() {
          self_.$dispatch('closeChart');
        });
      },
      changeView: function() {
        this.showTableIcon = !this.showTableIcon;
        this.showPieIcon = !this.showPieIcon;
        this.$dispatch('toTableView');
      },
      hasTitleTooltip: function() {
        return _.isObject(this.titleTooltip) && this.titleTooltip.content;
      }
    },
    ready: function() {
      $('#' + this.chartId + '-download').qtip('destroy', true);
      $('#' + this.chartId + '-download-icon-wrapper').qtip('destroy', true);
      $('#' + this.chartId + '-title').qtip('destroy', true);
      var chartId = this.chartId;
      var self = this;

      if (this.hasTitleTooltip()) {
        var target = [];
        if (this.showDespIcon) {
          target.push('#' + this.chartId + '-description-icon');
        }
        if (this.hasChartTitle) {
          target.push('#' + this.chartId + '-title');
        }
        $(target).qtip({
          id: this.chartId + '-title-qtip',
          content: {
            text: this.titleTooltip.content
          },
          style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
          show: {event: 'mouseover'},
          hide: {fixed: true, delay: 100, event: 'mouseout'},
          position: {my: 'right bottom', at: 'top left', viewport: $(window)}
        });
      }

      $('#' + this.chartId + '-download-icon-wrapper').qtip({
        style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
        show: {event: 'mouseover', delay: 0},
        hide: {fixed: true, delay: 300, event: 'mouseout'},
        position: {my: 'bottom left', at: 'top right', viewport: $(window)},
        content: {
          text: 'Download'
        }
      });

      $('#' + this.chartId + '-download').qtip({
        id: '#' + this.chartId + '-download-qtip',
        style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
        show: {event: 'click', delay: 0},
        hide: {fixed: true, delay: 300, event: 'mouseout'},
        position: {my: 'top center', at: 'bottom center', viewport: $(window)},
        content: {
          text: ''
        }, events: {
          show: function() {
            $('#' + chartId + '-download-icon-wrapper').qtip('api').hide();
          },
          render: function(event, api) {
            var downloadFileTypes = self.chartCtrl.getDownloadFileTypes();
            var content = [];
            _.each(downloadFileTypes, function(item) {
              content.push('<div style="display:inline-block;"><button id="' + self.chartId + '-' + item + '" style="width:50px">' + item.toUpperCase() + '</button></div>');
            });

            api.set('content.text', content.join('<br/>'));
            $('#' + chartId + '-pdf', api.elements.tooltip).click(function() {
              iViz.util.download(self.chartCtrl.getChartType(), 'pdf', self.chartCtrl.getDownloadData('pdf'));
            });
            $('#' + chartId + '-svg', api.elements.tooltip).click(function() {
              iViz.util.download(self.chartCtrl.getChartType(), 'svg', self.chartCtrl.getDownloadData('svg'));
            });
            $('#' + chartId + '-tsv').click(function() {
              iViz.util.download(self.chartCtrl.getChartType(), 'tsv', self.chartCtrl.getDownloadData('tsv'));
            });
          }
        }
      });
    }
  });
})(window.Vue,
  window.iViz,
  window.dc,
  window.$ || window.jQuery,
  window._);
