/**
 * @author Yichao Sun on 5/18/16.
 */
'use strict';
(function(Vue, dc, iViz, _) {
  Vue.component('survival', {
    template: '<div id={{chartDivId}} ' +
    'class="grid-item grid-item-h-2 grid-item-w-2" ' +
    ':attribute-id="attributes.attr_id" @mouseenter="mouseEnter" ' +
    '@mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations" ' +
    ':show-download-icon.sync="showDownloadIcon" ' +
    ':has-chart-title="hasChartTitle" :display-name="displayName" ' +
    ':groupid="attributes.group_id" :reset-btn-id="resetBtnId" :chart-ctrl="chartInst" ' +
    ' :chart-id="chartId" ' +
    ':attributes="attributes"></chart-operations>' +
    '<div v-show="!showLoad" :class="{\'show-loading-content\': showLoad}"' +
    'class="dc-chart dc-scatter-plot" align="center" id={{chartId}} ></div>' +
    '<div v-show="showLoad" class="progress-bar-parent-div" :class="{\'show-loading-bar\': showLoad}">' +
    '<progress-bar :div-id="loadingBar.divId" :status="loadingBar.status" :opts="loadingBar.opts"></progress-bar></div>' +
    '</div>',
    props: [
      'ndx', 'attributes'
    ],
    created: function() {
    },
    data: function() {
      return {
        chartDivId: iViz.util.getDefaultDomId('chartDivId', this.attributes.attr_id),
        resetBtnId: iViz.util.getDefaultDomId('resetBtnId', this.attributes.attr_id),
        chartId: iViz.util.getDefaultDomId('chartId', this.attributes.attr_id),
        displayName: this.attributes.display_name,
        chartInst: {},
        showOperations: false,
        fromWatch: false,
        fromFilter: false,
        hasChartTitle: true,
        showLoad: true,
        excludeNa: true,
        hasFilters: false,
        showDownloadIcon: true,
        showingRainbowSurvival: false,
        groups: [],
        invisibleDimension: {},
        loadingBar :{
          status: 0,
          divId: iViz.util.getDefaultDomId('progressBarId', this.attributes.attr_id),
          opts: {},
          infinityInterval: null
        },
        mainDivQtip: ''
      };
    },
    watch: {
      excludeNa: function() {
        if (this.showingRainbowSurvival) {
          this.updateRainbowSurvival();
        } else {
          this.updatePlotGroups(this.hasFilters);
          this.updatePlot();
          this.$dispatch('remove-rainbow-survival');
        }
      },
      showLoad: function(newVal) {
        if (newVal) {
          this.initialInfinityLoadingBar();
        } else {
          if (this.loadingBar.infinityInterval) {
            window.clearInterval(this.loadingBar.infinityInterval);
            this.loadingBar.infinityInterval = null;
          }
        }
      }
    },
    events: {
      'show-loader': function() {
        this.showLoad = true;
      },
      'update-special-charts': function(hasFilters) {
        this.showingRainbowSurvival = false;
        this.updatePlotGroups(hasFilters);
        this.updatePlot();
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
        this.groups = $.extend(true, [], _opts.groups);
        if (_opts.subtitle) {
          this.displayName = this.attributes.display_name + _opts.subtitle;
        }
        this.showingRainbowSurvival = true;
        this.updateRainbowSurvival();
      }
    },
    methods: {
      updateRainbowSurvival: function() {
        var groups = $.extend(true, [], this.groups);
        if (this.excludeNa) {
          groups = _.filter(groups, function(group) {
            return group.name !== 'NA';
          });
        }
        this.updatePlot(groups);
      },
      updatePlot: function(groups) {
        // Display name may be changed due to the rainbow survival
        this.displayName = this.attributes.display_name;

        this.chartInst.update(
          groups ? groups : this.groups, this.chartId, this.attributes.attr_id);
        this.checkDownloadableStatus();
        this.updateQtipContent();
        this.showLoad = false;
      },
      updatePlotGroups: function(hasFilters) {
        var _type = this.attributes.group_type;
        var attrId = _type === 'patient' ? 'patient_uid' : 'sample_uid';
        var groupId = this.attributes.group_id;
        var _selectedCases = [];
        var _nonNaCases = [];
        var _allCases = iViz.getCaseUIDs(_type).sort();
        var groups = [];

        this.hasFilters = hasFilters;

        if (this.hasFilters) {
          var filteredClinicalAttrs = {};
          _.each(this.$root.groups, function(group) {
            var _attrId = group.type === 'patient' ? 'patient_uid' : 'sample_uid';
            if (!filteredClinicalAttrs.hasOwnProperty(group.id)) {
              filteredClinicalAttrs[group.id] = {
                attrId: _attrId,
                attrs: [],
                nonNaCases: []
              };
            }
            filteredClinicalAttrs[group.id].attrs = [];
            
            // Loop through attrList instead of only using attr_id
            // Combination chart has its own attr_id, but the clinical data
            // it's using are listed under attrList
            _.each(_.filter(group.attributes, function(attr) {
              return attr.filter.length > 0;
            }), function(item) {
              filteredClinicalAttrs[group.id].attrs.push(_.pick(item, 'attr_id', 'attrList'));
            });
          });
          if (this.excludeNa) {
            // Find qualified cases in each group.
            _.each(filteredClinicalAttrs, function(group, _groupId) {
              var data_ = iViz.getGroupNdx(_groupId);
              var nonNaCases = [];

              //Check whether case contains NA value on filtered attrs
              var _attrs = {};
              _.each(group.attrs, function(groupAttr) {
                _.each(groupAttr.attrList, function(listItem) {
                  _attrs[listItem] = 1;
                })
              });
              _attrs = Object.keys(_attrs);

              _.each(data_, function(data) {
                var hasNaWithinAttrs = false;
                _.some(_attrs, function(attr) {
                  // All data has been normalized to NA for different NA values
                  if (data[attr] === 'NA') {
                    hasNaWithinAttrs = true;
                    return true;
                  }
                });

                if (!hasNaWithinAttrs) {
                  var _caseId = data[group.attrId];
                  if (groupId !== _groupId) {
                    if (_type === 'patient') {
                      _caseId = iViz.getPatientUIDs(_caseId);
                    } else {
                      _caseId = iViz.getSampleUIDs(_caseId)
                    }
                  }
                  if (_.isArray(_caseId)) {
                    nonNaCases.push.apply(nonNaCases, _caseId);
                  } else {
                    nonNaCases.push(_caseId);
                  }
                }
              });
              group.nonNaCases = nonNaCases.sort();
            });

            // Find unique data from each group.
            var _list = _.pluck(filteredClinicalAttrs, 'nonNaCases');
            for (var i = 0; i < _list.length; i++) {
              if (i === 0) {
                _nonNaCases = _list[0];
                continue;
              }
              _nonNaCases = iViz.util.intersection(_nonNaCases, _list[i]);
            }
            _selectedCases = iViz.util.intersection(_nonNaCases, _.pluck(this.invisibleDimension.top(Infinity), attrId).sort());
            _allCases = iViz.util.intersection(_nonNaCases, _allCases);
          } else {
            _selectedCases =
              _.pluck(this.invisibleDimension.top(Infinity), attrId).sort();
          }
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
            caseIds: iViz.util.difference(
              _allCases, _selectedCases),
            curveHex: '#2986e2',
            name: 'Unselected Patients'
          }];
        }
        groups = this.calcCurvesData(groups, _type);
        this.groups = groups;
      },
      updateQtipContent: function() {
        if (this.mainDivQtip) {
          var self_ = this;
          var qtipContent = ['<div>'];
          var groups = this.chartInst.getGroups();
          var api = this.mainDivQtip.qtip('api');
          _.each(groups, function(group) {
            qtipContent.push(
              '<div class="category-item" curve-id="' + group.id + '">' +
              '<svg width="12" height="12">' +
              '<rect height="12" width="12" fill="' +
              group.curveHex + '"></rect>' +
              '</svg><span>' + group.name + '</span></div>');
          });
          qtipContent.push('</div>');

          qtipContent.push('<div class="checkbox-div">' +
            '<input type="checkbox" class="checkbox" ' +
            (this.excludeNa ? 'checked' : '') + '><span>' +
            'Exclude patients with NA for any of the selected attribute(s)</span></div>');
          api.set('content.text', qtipContent.join(''));

          // Tender tooltip after updating content
          // Otherwise, api.elements.tooltip will return null.
          api.render();

          var tooltip = api.elements.tooltip;
          tooltip.find('.category-item').click(function() {
            var curveId = $(this).attr('curve-id');
            self_.chartInst.highlightCurve(curveId);
          });
          tooltip.find('.checkbox-div .checkbox').change(function() {
            self_.excludeNa = this.checked;
          });
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
            //  var _index = iViz.getCaseIndices(survivalType)[id];
            group.data.push(data_[id]);
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
          show: {event: 'mouseover', delay: 300},
          hide: {fixed: true, delay: 300, event: 'mouseleave'},
          // hide: false,
          position: {
            my: 'left center',
            at: 'center right',
            viewport: $(window)
          },
          content: '<div>Loading...</div>'
        });
        self_.updateQtipContent();
      },
      initialInfinityLoadingBar: function() {
        var self = this;
        self.loadingBar.opts = {
          duration: 300,
          step: function(state, bar) {
            bar.setText('Loading...');
          }
        };
        self.loadingBar.status = 0.5;
        self.loadingBar.infinityInterval = setInterval(function() {
          self.loadingBar.status += 0.5;
        }, 300);
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
      var attrId =
        this.attributes.group_type === 'patient' ? 'patient_uid' : 'sample_uid';
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
        caseIds: iViz.getCaseUIDs(_type)
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
