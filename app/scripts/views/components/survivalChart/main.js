/**
 * Created by Yichao Sun on 5/18/16.
 */

'use strict';
(function(iViz, _) {
  iViz.view.component.Survival = function() {
    var content_ = this;
    var opts_ = {
      downloadIsEnabled: true
    };
    var groups_ = [];

    content_.init = function(groups, _data, _opts) {
      opts_ = $.extend(true, {}, _opts);
      $('#' + opts_.chartId).empty();
      var _dataProxy = new iViz.data.SurvivalChartProxy(_data, opts_.attrId);
      this.chartInst_ =
        new iViz.view.component
          .SurvivalCurve(opts_.chartId, _dataProxy.get(), opts_);
      this.update(groups, _opts.chartId, _opts.attrId);
    };

    // _attrId here indicates chart type (OS or DFS)
    content_.update = function(groups, _chartId, _attrId) {
      // remove previous curves
      var _chartInst_ = this.chartInst_;
      var _newGroups = [];
      _chartInst_.removeCurves();
      _chartInst_.removePval();
      _chartInst_.removeNoInfo();

      if (_.isArray(groups)) {

        // Calculate proxy data for each group
        _.each(groups, function(group) {
          group.proxyData =
            new iViz.data.SurvivalChartProxy(group.data, _attrId).get();
          if(_.isArray(group.proxyData) && group.proxyData.length > 0) {
            _newGroups.push(group);
          }
        });

        if (_newGroups.length > 0) {
          if (_newGroups.length === 2) {
            _chartInst_.addPval(_newGroups[0].proxyData, _newGroups[1].proxyData);
          }
          _.each(_newGroups, function(group, index) {
            _chartInst_.addCurve(group.proxyData, index, group.curveHex);
          });
          opts_.downloadIsEnabled = true;
        } else {
          _chartInst_.addNoInfo();
          opts_.downloadIsEnabled = false;
        }
      }
      groups_ = _newGroups;
    };

    content_.updateDataForDownload = function(fileType) {
      if (opts_.downloadIsEnabled && ['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      }
    };

    content_.getGroups = function() {
      return groups_;
    };

    content_.highlightCurve = function(curveId) {
      this.chartInst_.highlightCurve(curveId);
    };
    
    content_.downloadIsEnabled = function() {
      return opts_.downloadIsEnabled;
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
