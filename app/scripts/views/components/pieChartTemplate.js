/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an 'as is' basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * Created by Karthik Kalletla on 4/6/16.
 */
'use strict';
(function(Vue, dc, iViz, $) {

  var width = 130;
  var height = 150;
  var radius = (width - 20) / 2;
  var NAIndex = -1;
  Vue.component('pieChart', {
    template: '<div id={{charDivId}} class="grid-item" @mouseenter="mouseEnter" @mouseleave="mouseLeave">' +
    '<chart-operations :show-operations="showOperations" :groupid="groupid" :reset-btn-id="resetBtnId" :chart="chartInst"></chart-operations>' +
    '<div class="dc-chart dc-pie-chart" align="center" style="float:none' +
    ' !important;" id={{chartId}} ><p' +
    ' class="text-center">{{displayName}}</p></div>' +
    '</div>',
    props: [
      'ndx', 'attributes', 'filters', 'groupid'
    ],
    data: function() {
      return {
        v: {},
        charDivId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") +
        '-div',
        resetBtnId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, "") +
        '-reset',
        chartId: 'chart-' + this.attributes.attr_id.replace(/\(|\)/g, ""),
        displayName: this.attributes.display_name,
        chartInst: '',
        showOperations: false,
        fromWatch: false,
        fromFilter: false
      }
    },
    watch: {
      'filters': function(newVal, oldVal) {
        if (!this.fromFilter) {
          this.fromWatch = true
          if (newVal.length === oldVal.length) {
            if (newVal.length == 0) {
              this.chartInst.filterAll();
              dc.redrawAll(this.groupid)
            } else {
              var newFilters = $.extend(true, [], newVal)
              var exisitngFilters = $.extend(true, [], this.chartInst.filters())
              var temp = _.difference(exisitngFilters, newFilters);
              this.chartInst.filter(temp);
              dc.redrawAll(this.groupid)
            }
          }
        } else {
          this.fromFilter = false;
        }
      },
    },
    methods: {
      mouseEnter: function() {
        this.showOperations = true;
      }, mouseLeave: function() {
        this.showOperations = false;
      }
    },
    ready: function() {
      this.v.data = $.extend(true, {}, this.attributes);
      this.v.data = {
        color: $.extend(true, [], iViz.util.getColors()),
        category: ''
      };
      var color = $.extend(true, [], this.v.data.color);
      var attr = this.attributes.attr_id;
      var cluster = this.ndx.dimension(function(d) {
        return d[attr];
      });
      this.chartInst = dc.pieChart('#' + this.chartId, this.groupid);
      this.v.data.attrKeys = cluster.group().all().map(function(d) {
        return d.key;
      });
      this.v.data.category =
        iViz.util.pieChart.getCategory(this.attributes.attr,
          this.v.data.attrKeys);

      this.v.data.attrKeys.sort(function(a, b) {
        return a < b ? -1 : 1;
      });

      NAIndex = this.v.data.attrKeys.indexOf('NA');
      if (NAIndex !== -1) {
        color.splice(NAIndex, 0, '#CCCCCC');
      }
      this.chartInst
        .width(width)
        .height(height)
        .radius(radius)
        .dimension(cluster)
        .group(cluster.group())
        .transitionDuration(400)
        .ordinalColors(color)
        .label(function(d) {
          return d.value;
        })
        .ordering(function(d) {
          return d.key;
        });
      var self_ = this;
      this.chartInst.on('filtered', function(_chartInst, _filter) {
        if (!self_.fromWatch) {
          self_.fromFilter = true
          var tempFilters_ = $.extend(true, [], self_.filters);
          tempFilters_ = iViz.shared.updateFilters(_filter, tempFilters_,
            self_.attributes.attr_id, self_.attributes.view_type);
          self_.filters = tempFilters_;
        } else {
          self_.fromWatch = false;
        }

        self_.$dispatch('update-filters')
      });
      this.$dispatch('data-loaded', true)
    }
  });
})(window.Vue, window.dc, window.iViz,
  window.$ || window.jQuery);
