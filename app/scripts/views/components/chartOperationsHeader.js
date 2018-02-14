/**
 * Created by Karthik Kalletla on 4/14/16.
 */
'use strict';
(function(Vue, iViz, dc, $, _) {
  Vue.component('chartOperations', {
    template: '<div class="chart-header" id="{{chartId}}-chart-header">' +
    '<div class="chart-title" ' +
    ':class="[showOperations?chartTitleActive:chartTitle]" ' +
    'v-if="hasChartTitle">' +
    '<span class="chart-title-span" id="{{chartId}}-title">{{displayName}}' +
    '</span></div>' +
    '<div :class="[showOperations?chartOperationsActive:chartOperations]">' +
    '<div class="checkbox-div" v-if="showLogScale && chartInitialed"">' +
    '<input type="checkbox" value="" id="" ' +
    'class="checkbox" v-model="logChecked">' +
    '<span id="scale-span-{{chartId}}">' +
    'Log Scale X</span></div>' +
    '<i v-show="hasFilters" class="fa fa-undo icon hover" ' +
    'aria-hidden="true" @click="reset()"></i>' +
    '<i v-if="hasTitleTooltip()" ' +
    'class="fa fa-info-circle icon hover" ' +
    'id="{{chartId}}-description-icon"' +
    'aria-hidden="true"></i>' +
    '<i v-if="showTableIcon && chartInitialed" class="fa fa-table icon hover" ' +
    'aria-hidden="true" @click="changeView()" alt="Convert pie chart to table"></i>' +
    '<i v-if="showPieIcon && chartInitialed"" class="fa fa-pie-chart icon hover" ' +
    'aria-hidden="true" @click="changeView()" alt="Convert table to pie chart"></i>' +
    '<div class="dc-survival-icon" style="float: left;"><img v-if="showSurvivalIcon && chartInitialed" src="images/survival_icon.svg" ' +
    'class="icon hover" @click="getRainbowSurvival" alt="Survival Analysis"/></div>' +
    '<div v-if="showDownloadIcon && chartInitialed"" id="{{chartId}}-download-icon-wrapper" class="download">' +
    '<i class="fa fa-download icon hover" alt="download" ' +
    'id="{{chartId}}-download"></i>' +
    '</div>' +
    '<i class="fa fa-arrows dc-chart-drag icon" aria-hidden="true" alt="Move chart"></i>' +
    '<div style="float:right"><i class="fa fa-times dc-remove-chart-icon icon" ' +
    '@click="close()" alt="Delete chart"></i></div>' +
    '</div>' +
    '</div>',
    props: {
      showOperations: {
        type: Boolean,
        default: true
      }, resetBtnId: {
        type: String
      }, chartCtrl: {
        type: Object
      }, groupid: {
        type: String
      }, hasChartTitle: {
        type: Boolean,
        default: false
      }, showTable: {
        type: Boolean
      }, displayName: {
        type: String
      }, chartId: {
        type: String
      }, showPieIcon: {
        type: Boolean
      }, showTableIcon: {
        type: Boolean
      }, showLogScale: {
        type: Boolean,
        default: false
      }, showSurvivalIcon: {
        type: Boolean,
        default: false
      }, filters: {
        type: Array
      }, attributes: {
        type: Object
      }, showDownloadIcon: {
        type: Boolean,
        default: true
      }, chartInitialed: {
        type: Boolean,
        default: true
      }
    },
    data: function() {
      return {
        chartOperationsActive: 'chart-operations-active',
        chartOperations: 'chart-operations',
        chartTitle: 'chart-title',
        chartTitleActive: 'chart-title-active chart-title-active-' + 3,
        logChecked: true,
        hasFilters: false,
        titleIconQtipOpts: {
          style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
          show: {event: 'mouseover', delay: 0},
          hide: {fixed: true, delay: 300, event: 'mouseout'},
          position: {my: 'bottom left', at: 'top right', viewport: $(window)},
          content: {}
        },
        titleTooltip: {
          content: _.isObject(this.attributes) ?
            iViz.util.getClinicalAttrTooltipContent(this.attributes) : ''
        },
        numOfIcons: 3
      };
    },
    watch: {
      logChecked: function(newVal) {
        this.reset();
        this.$dispatch('changeLogScale', newVal);
      },
      filters: function(newVal) {
        this.hasFilters = newVal.length > 0;
      },
      showSurvivalIcon: function(newVal) {
        if (newVal) {
          this.numOfIcons++;
        } else {
          this.numOfIcons--;
        }
      },
      showDownloadIcon: function(newVal) {
        if (newVal) {
          this.numOfIcons++;
        } else {
          this.numOfIcons--;
        }
      },
      numOfIcons: function(newVal) {
        this.chartTitleActive = 'chart-title-active chart-title-active-' + newVal;
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
      updateChartTypeIconTooltip: function() {
        $('#' + this.chartId + '-chart-header .fa-table').qtip('destroy', true);
        $('#' + this.chartId + '-chart-header .fa-pie-chart').qtip('destroy', true);

        if (this.showTableIcon) {
          this.$nextTick(function() {
            $('#' + this.chartId + '-chart-header .fa-table').qtip($.extend(true, this.titleIconQtipOpts, {
              content: {
                text: 'Convert pie chart to table'
              }
            }));
          });
        }

        if (this.showPieIcon) {
          this.$nextTick(function() {
            $('#' + this.chartId + '-chart-header .fa-pie-chart').qtip($.extend(true, this.titleIconQtipOpts, {
              content: {
                text: 'Convert table to pie chart'
              }
            }));
          });
        }
      },
      changeView: function() {
        this.showTableIcon = !this.showTableIcon;
        this.showPieIcon = !this.showPieIcon;
        this.updateChartTypeIconTooltip();
        this.$dispatch('toTableView');
      },
      getRainbowSurvival: function() {
        this.$dispatch('getRainbowSurvival');
      },
      hasTitleTooltip: function() {
        return _.isObject(this.attributes) ?
          (['survival'].indexOf(this.attributes.view_type) === -1 &&
            _.isObject(this.titleTooltip) && this.titleTooltip.content) : false;
      }
    },
    ready: function() {
      $('#' + this.chartId + '-download').qtip('destroy', true);
      $('#' + this.chartId + '-download-icon-wrapper').qtip('destroy', true);
      $('#' + this.chartId + '-title').qtip('destroy', true);
      var chartId = this.chartId;
      var self = this;

      if (this.hasTitleTooltip()) {
        var target = ['#' + this.chartId + '-description-icon'];
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

      $('#' + this.chartId + '-download-icon-wrapper').qtip($.extend(true, this.titleIconQtipOpts, {
        content: {
          text: 'Download'
        }
      }));

      $('#' + this.chartId + '-chart-header .dc-chart-drag').qtip($.extend(true, this.titleIconQtipOpts, {
        content: {
          text: 'Move chart'
        }
      }));

      $('#' + this.chartId + '-chart-header .dc-remove-chart-icon').qtip($.extend(true, this.titleIconQtipOpts, {
        content: {
          text: 'Delete chart'
        }
      }));

      $('#' + this.chartId + '-chart-header .dc-survival-icon').qtip($.extend(true, this.titleIconQtipOpts, {
        content: {
          text: 'Survival Analysis'
        }
      }));

      this.updateChartTypeIconTooltip();

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
            var downloadFileTypes = self.chartCtrl.getDownloadFileTypes().sort(function(a, b) {
              a = a === 'tsv' ? 'data' : a;
              b = b === 'tsv' ? 'data' : b;
              return a > b;
            });
            var content = [];
            _.each(downloadFileTypes, function(item) {
              content.push('<div style="display:inline-block;"><button id="' + self.chartId + '-' + item + '" style="width:50px">' + (item === 'tsv' ? 'DATA' : item.toUpperCase()) + '</button></div>');
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

      var _numOfIcons = this.numOfIcons;

      if (self.showPieIcon) {
        _numOfIcons++;
      }

      if (self.showTableIcon) {
        _numOfIcons++;
      }

      if (self.showSurvivalIcon) {
        _numOfIcons++;
      }

      if (self.hasTitleTooltip()) {
        _numOfIcons++;
      }

      if (self.showLogScale) {
        _numOfIcons++;
      }

      if (self.showDownloadIcon) {
        _numOfIcons++;
      }

      if (self.attributes.view_type
        && self.attributes.view_type === 'survival') {
        _numOfIcons += 5;
      }

      this.numOfIcons = _numOfIcons;
    }
  });
})(window.Vue,
  window.iViz,
  window.dc,
  window.$ || window.jQuery,
  window._);
