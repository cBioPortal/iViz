/**
 * Created by Yichao Sun on 5/11/16.
 */

'use strict';
(function(iViz, _, d3, $, Plotly, cbio) {
  iViz.view.component.ScatterPlot = function() {
    var content = this;
    var chartId_;
    var data_;
    var opts_;

    content.init = function(_data, opts) {
      opts_ = $.extend(true, {}, opts);
      chartId_ = opts_.chartId;
      data_ = _data;
      var _xArr = _.pluck(data_, 'cna_fraction');
      var _yArr = _.pluck(data_, 'mutation_count');
      var _qtips = [];
      _.each(data_, function(_dataObj) {
        _qtips.push('Cancer Study:' + _dataObj.study_id + '<br>Sample Id: ' +
          _dataObj.sample_id + '<br>CNA fraction: ' +
          cbio.util.toPrecision(_dataObj.cna_fraction, 2, 0.001) +
          '<br>Mutation count: ' + _dataObj.mutation_count);
      });
      var trace = {
        x: _xArr,
        y: _yArr,
        text: _qtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        study_id: _.pluck(data_, 'study_id'),
        sample_id: _.pluck(data_, 'sample_id'),
        marker: {
          size: 7,
          color: '#2986e2',
          line: {color: 'white'}
        }
      };
      var data = [trace];
      var _marginX = (d3.max(_xArr) - d3.min(_xArr)) * 0.05;
      var _marginY = (d3.max(_yArr) - d3.min(_yArr)) * 0.05;
      var layout = {
        xaxis: {
          title: 'Fraction of copy number altered genome',
          range: [d3.min(_xArr) - _marginX, d3.max(_xArr) + _marginX],
          fixedrange: true,
          zeroline: false,
          showline: true
        },
        yaxis: {
          title: '# of mutations',
          range: [d3.min(_yArr) - _marginY, d3.max(_yArr) + _marginY],
          zeroline: false,
          showline: true
        },
        hovermode: 'closest',
        showlegend: false,
        width: 370,
        height: 320,
        margin: {
          l: 60,
          r: 10,
          b: 50,
          t: 30,
          pad: 0
        }
      };
      Plotly.plot(document.getElementById(chartId_), data, layout, {
        displaylogo: false,
        modeBarButtonsToRemove: ['sendDataToCloud', 'pan2d',
          'zoomIn2d', 'zoomOut2d', 'resetScale2d',
          'hoverClosestCartesian', 'hoverCompareCartesian']
      });

      // link to sample view
      var _plotsElem = document.getElementById(chartId_);
      _plotsElem.on('plotly_click', function(data) {
        var _pts_study_id =
          data.points[0].data.study_id[data.points[0].pointNumber];
        var _pts_sample_id =
          data.points[0].data.sample_id[data.points[0].pointNumber];
        window.open(
          cbio.util.getLinkToSampleView(_pts_study_id, _pts_sample_id));
      });

      initCanvasDownloadData();
    };

    // update selected samples (change color)
    content.update = function(_sampleIds) {
      var _selectedData = [];
      var _unselectedData = [];

      var _tmpSelectedSampleIdMap = {};
      _.each(_sampleIds, function(_sampleId) {
        _tmpSelectedSampleIdMap[_sampleId] = '';
      });
      _.each(data_, function(_dataObj) {
        if (_tmpSelectedSampleIdMap.hasOwnProperty(_dataObj.sample_id)) {
          _selectedData.push(_dataObj);
        } else {
          _unselectedData.push(_dataObj);
        }
      });

      document.getElementById(chartId_).data = [];
      var _unselectedDataQtips = [];
      var _selectedDataQtips = [];

      _.each(_unselectedData, function(_dataObj) {
        _unselectedDataQtips.push('Cancer Study:' + _dataObj.study_id +
          '<br>Sample Id: ' + _dataObj.sample_id + '<br>CNA fraction: ' +
          cbio.util.toPrecision(_dataObj.cna_fraction, 2, 0.001) +
          '<br>Mutation count: ' + _dataObj.mutation_count);
      });
      _.each(_selectedData, function(_dataObj) {
        _selectedDataQtips.push('Cancer Study:' + _dataObj.study_id +
          '<br>Sample Id: ' + _dataObj.sample_id + '<br>CNA fraction: ' +
          cbio.util.toPrecision(_dataObj.cna_fraction, 2, 0.001) +
          '<br>Mutation count: ' + _dataObj.mutation_count);
      });
      document.getElementById(chartId_).data[0] = {
        x: _.pluck(_unselectedData, 'cna_fraction'),
        y: _.pluck(_unselectedData, 'mutation_count'),
        text: _unselectedDataQtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        study_id: _.pluck(data_, 'study_id'),
        sample_id: _.pluck(data_, 'sample_id'),
        marker: {
          size: 6,
          color: '#2986e2',
          line: {color: 'white'}
        }
      };
      document.getElementById(chartId_).data[1] = {
        x: _.pluck(_selectedData, 'cna_fraction'),
        y: _.pluck(_selectedData, 'mutation_count'),
        text: _selectedDataQtips,
        mode: 'markers',
        type: 'scatter',
        hoverinfo: 'text',
        study_id: _.pluck(data_, 'study_id'),
        sample_id: _.pluck(data_, 'sample_id'),
        marker: {
          size: 6,
          color: 'red',
          line: {color: 'white'}
        }
      };
      Plotly.redraw(document.getElementById(chartId_));
    };

    content.updateDataForDownload = function(fileType) {
      if (['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      }
    };

    function initCanvasDownloadData() {
      content.setDownloadData('svg', {
        title: opts_.title,
        chartDivId: opts_.chartId,
        fileName: opts_.title
      });
      content.setDownloadData('pdf', {
        title: opts_.title,
        chartDivId: opts_.chartId,
        fileName: opts_.title
      });
    }
  };

  iViz.view.component.ScatterPlot.prototype =
    new iViz.view.component.GeneralChart('scatterPlot');
  iViz.view.component.ScatterPlot.constructor =
    iViz.view.component.ScatterPlot;
  iViz.util.scatterPlot = (function() {
  })();
})(window.iViz,
  window._,
  window.d3,
  window.jQuery || window.$,
  window.Plotly,
  window.cbio
);
