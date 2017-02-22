/**
 * Created by Yichao Sun on 5/18/16.
 */

'use strict';
(function(iViz, _) {
  iViz.view.component.Survival = function() {
    var content_ = this;
    var opts_ = {};
    var groups_ = [];

    content_.init = function(_data, _opts) {
      opts_ = $.extend(true, {}, _opts);
      $('#' + opts_.chartId).empty();
      var _dataProxy = new iViz.data.SurvivalChartProxy(_data, opts_.attrId);
      this.chartInst_ =
        new iViz.view.component
          .SurvivalCurve(opts_.chartId, _dataProxy.get(), opts_);
      this.chartInst_.addCurve(_dataProxy.get(), 0, opts_.curveHex || '#2986e2');
      groups_ = [{
        name: 'All Patients',
        curveHex: opts_.curveHex || '#2986e2'
      }];
    };

    // _attrId here indicates chart type (OS or DFS)
    content_.update = function(groups, _chartId, _attrId) {
      // remove previous curves
      var _chartInst_ = this.chartInst_;
      _chartInst_.removeCurves();

      // Calculate proxy data for each group
      _.each(groups, function(group) {
        group.proxyData =
          new iViz.data.SurvivalChartProxy(group.data, _attrId).get();
      });

      if (groups.length === 1) {
        _chartInst_.addCurve(
          groups[0].proxyData, 0, groups[0].curveHex || '#2986e2');
      } else {
        _.each(groups, function(group, index) {
          _chartInst_.addCurve(group.proxyData, index, group.curveHex);
        });
      }
      if (groups.length === 2) {
        _chartInst_.addPval(groups[0].proxyData, groups[1].proxyData);
      } else {
        _chartInst_.removePval();
      }
      groups_ = groups;
    };

    content_.updateDataForDownload = function(fileType) {
      if (['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      }
    };

    content_.getGroups = function() {
      return groups_;
    };

    function initCanvasDownloadData() {
      content_.setDownloadData('svg', {
        title: opts_.title,
        chartDivId: opts_.chartId,
        fileName: opts_.title
      });
      content_.setDownloadData('pdf', {
        title: opts_.title,
        chartDivId: opts_.chartId,
        fileName: opts_.title
      });
    }
  };
  iViz.view.component.Survival.prototype =
    new iViz.view.component.GeneralChart('survivalPlot');
  iViz.view.component.Survival.constructor = iViz.view.component.Survival;
})(
  window.iViz,
  window._
);
