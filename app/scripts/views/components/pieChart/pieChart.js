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
 * @author Hongxin Zhang on 3/10/16.
 */

'use strict';
(function(iViz, dc, _, $) {
  // iViz pie chart component. It includes DC pie chart.
  iViz.view.component.PieChart = function(ndx, attributes, opts, cluster) {
    var content = this;
    var v = {};

    v.chart = '';

    v.data = {
      color: $.extend(true, [], iViz.util.getColors()),
      category: ''
    };

    /* HTML options*/
    v.opts = {};

    v.opts = $.extend(true, v.opts, opts);
    v.data = $.extend(true, v.data, attributes);
    v.data.ndx = ndx;
    
    var labels = [];
    var reactTableData = {};
    reactTableData.attributes = [
      {
        "attr_id": "name",
        "display_name": v.data.display_name,
        "datatype": "STRING",
        "column_width": 213
      },
      {
        "attr_id": "color",
        "display_name": "Color",
        "datatype": "STRING",
        "show": false
      },
      {
        "attr_id": "samples",
        "display_name": "#",
        "datatype": "NUMBER",
        "column_width": 70
      },
      {
        "attr_id": "sampleRate",
        "display_name": "Freq",
        "datatype": "PERCENTAGE",
        "column_width": 90
      },
      {
        "attr_id": "caseIds",
        "display_name": "Cases",
        "datatype": "STRING",
        "show": false
      },
      {
        "attr_id": "uniqueId",
        "display_name": "uniqueId",
        "datatype": "STRING",
        "show": false
      }
    ];
    var labelMetaData = null;
    var currentView = 'pie';
    var updateQtip = false;
    var qtipRendered = false;
    var isFiltered = false;

    /**
     * Only will be initialized at first time. Label name as key, contains color.
     * @type {{}}
     */
    var labelInitData = {};

    var dcGroup_ = '';
    var dcDimension_ = '';

    initDCPieChart();

    content.getChart = function() {
      return v.chart;
    };

    content.changeView = function(vm,toTableView){
      currentView = toTableView?'table':'pie';
      var chartDivDom = $("#"+v.opts.chartDivId);
      chartDivDom.css('z-index', 16000);

      //qtip wont be needed in table view
      chartDivDom.qtip('destroy', true);

      if(currentView === 'table'){
          updateReactTable();
        animateTable("#"+v.opts.chartDivId, 'table', function() {
          vm.$dispatch('update-grid');
          $("#"+v.opts.chartDivId).css('z-index', '');
        });
      }else{
        animateTable("#"+v.opts.chartDivId, 'pie', function() {
          vm.$dispatch('update-grid');
          $("#"+v.opts.chartDivId).css('z-index', '1');
        });
        content.initMainDivQtip();
      }
    };

    content.initMainDivQtip = function(){
      $('#' +v.opts.chartDivId).qtip({
        id: v.opts.chartDivId+'-qtip',
        style: {
          classes: 'qtip-light qtip-rounded qtip-shadow forceZindex qtip-max-width iviz-pie-qtip iviz-pie-label-qtip'
        },
        show: {event: "mouseover", solo: true, delay: 0, ready: true},
        hide: {fixed:true, delay: 300, event: "mouseleave"},
        // hide: false,
        position: {my:'left center',at:'center right', viewport: $(window)},
        content: '<div id="qtip-' + v.opts.chartDivId + '-content-react">Loading....</div>',
        events: {
          show:function(){
            if(qtipRendered){
              qtipRendered = false;
              updateQtip = false;
            }else{
              if(updateQtip){
                labelMetaData = null;
                updateQtip = false;
                updatePieLabels();
              }
            }
          },
          render: function() {
            qtipRendered = true;
            updatePieLabels();
          }
        }
      });
    };

    content.updateDataForDownload = function(fileType) {
      if (fileType === 'tsv') {
        initTsvDownloadData();
      } else if (['pdf', 'svg'].indexOf(fileType) !== -1) {
        initCanvasDownloadData();
      }
    };

    content.filtered = function() {
      if(qtipRendered) {
        updateTables();
      }
      isFiltered = true;
      updateQtip = false;
    };

    /**
     * This is the function to initialize dc pie chart instance.
     */
    function initDCPieChart() {
      if (v.opts.hasOwnProperty('chartId') &&
        v.data.hasOwnProperty('ndx') &&
        v.data.hasOwnProperty('attr_id')) {
        var width = v.opts.width || 130;
        var height = v.opts.height;
        var radius = (width - 20) / 2;
        var color = $.extend(true, [], v.data.color);

        v.chart = dc.pieChart('#' + v.opts.chartId, v.opts.groupid);

        v.data.attrKeys = cluster.group().all().map(function(d) {
          return d.key;
        });

        v.data.category = iViz.util.pieChart.getCategory(v.data.attr_id,
          v.data.attrKeys);

        v.data.attrKeys.sort(function(a, b) {
          return a < b ? -1 : 1;
        });

        var NAIndex = v.data.attrKeys.indexOf('NA');
        if (NAIndex !== -1) {
          color.splice(NAIndex, 0, '#CCCCCC');
        }

        // Initial labels data with colors.
        _.each(v.data.attrKeys, function(attr, index) {
          labelInitData[attr] = {
            attr: attr,
            color: color[index],
            id: attr,
            index:index
          };
        });

        dcDimension_ = cluster;
        dcGroup_ = cluster.group();

        v.chart
          .width(width)
          .height(height)
          .radius(radius)
          .dimension(dcDimension_)
          .group(dcGroup_)
          .transitionDuration(v.opts.transitionDuration || 400)
          .ordinalColors(color)
          .label(function(d) {
            return d.value;
          })
          .ordering(function(d) {
            return d.key;
          });
        v.chart.on("preRedraw",function(){
          removeMarker();
        });
        v.chart.on("postRedraw",function(){
            //TODO:commented this because this is taking much time to redraw after applying filter, need to find different way
          if(isFiltered){
            updateQtip = false;
            isFiltered = false;
          }else{
            updateQtip = true;
            if(currentView == 'table'){
              updatePieLabels();
            }
          }
        });
      } else {
        // TODO:
        /**
         * Need a handler if no dimension ID passed.
         */
      }
    }

    function initTsvDownloadData() {
      var data = v.data.display_name + '\tCount';

      var meta = labels || [];

      for (var i = 0; i < meta.length; i++) {
        data += '\r\n';
        data += meta[i].name + '\t';
        data += meta[i].samples;
      }
      content.setDownloadData('tsv', {
        fileName: v.data.display_name || 'Pie Chart',
        data: data
      });
    }

    function initCanvasDownloadData() {
      content.setDownloadData('svg', {
        title: v.data.display_name,
        chartDivId: v.opts.chartDivId,
        chartId: v.opts.chartId,
        fileName: v.data.display_name,
        labels: labels
      });
      content.setDownloadData('pdf', {
        title: v.data.display_name,
        chartDivId: v.opts.chartDivId,
        chartId: v.opts.chartId,
        fileName: v.data.display_name,
        labels: labels
      });
    }

    function animateTable(target, view, callback) {
      var width = window.style['grid-w-1'] || '180px';
      var height = window.style['grid-h-1'] || '165px';

      if (view === 'table') {
        width = window.style['grid-w-2'] || '375px';
        height = window.style['grid-h-2'] || '340px';
      }

      $(target).animate({
        height: height,
        width: width,
        duration: 300,
        queue: false
      }, 300, function() {
        if (_.isFunction(callback)) {
          callback();
        }
      });
    }

    function updatePieLabels() {
      updateCurrentLabels();
      initReactData();
      updateTables();
    }

    function updateTables() {
      if(currentView === 'pie') {
        updateQtipReactTable();
      }
      if(currentView === 'table') {
        updateReactTable();
      }
    }

    function updateReactTable() {
      var data = $.extend(true, {}, reactTableData);
      initReactTable(v.opts.chartTableId, data);
    }

    function updateQtipReactTable() {
      var data = $.extend(true, {}, reactTableData);
      data.attributes[0].column_width = 140;
      initReactTable('qtip-' + v.opts.chartDivId + '-content-react', data, {
        tableWidth: 300,
        pieLabelMouseEnterFunc: pieLabelMouseEnter,
        pieLabelMouseLeaveFunc: pieLabelMouseLeave
      });
    }


    function updateCurrentLabels() {
      var _labels = {};
      var _currentSampleSize = 0;
      _.each(dcGroup_.top(Infinity), function(label) {
        var _labelDatum = {};
        var _labelValue = Number(label.value);
        if(_labelValue > 0){
          _labelDatum.id = labelInitData[label.key].id;
          _labelDatum.index = labelInitData[label.key].index;
          _labelDatum.name = label.key;
          _labelDatum.color = labelInitData[label.key].color;
          _labelDatum.samples = _labelValue;
          _currentSampleSize += _labelValue;
          _labels[_labelDatum.id ] = _labelDatum;
        }
      });

      _.each(_labels, function(label) {
        label.sampleRate = (_currentSampleSize <= 0 ? 0 : (Number(label.samples) * 100 / _currentSampleSize).toFixed(1).toString()) + '%';
      });
      labels = _labels;
    }

    function initReactData() {
      var _data = [];
      _.each(labels, function(item) {
        for (var key in item) {
          var datum = {
            'attr_id': key,
            'uniqueId': item.id,
            'attr_val': item[key]
          };
          _data.push(datum);
        }
      });
      reactTableData.data = _data;
    }

    function removeMarker() {
      $("#" + v.opts.chartId).find('svg g .mark').remove();
    }

    function drawMarker(_childID,_fatherID) {
      var _path = $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + _childID+')')
        .find('path');
      var _pointsInfo = _path
          .attr('d')
          .split(/[\s,MLHVCSQTAZ]/);

      var _pointsInfo1 =_path
          .attr('d')
          .split(/[A]/);

      var _fill =_path
          .attr('fill');

      var _x1 = Number(_pointsInfo[1]),
        _y1 = Number(_pointsInfo[2]),
      //_largeArc = Number(_pointsInfo[6]),
        _x2 = Number(_pointsInfo[8]),
        _y2 = Number(_pointsInfo[9]),
        _r = Number(_pointsInfo[3]);

      if((_x1 - _x2!==0 || _y1 - _y2!==0) && _pointsInfo1.length === 2){
        var _pointOne = Math.atan2(_y1,_x1);
        var _pointTwo = Math.atan2(_y2,_x2);

        if(_pointOne < -Math.PI/2){
          _pointOne = Math.PI/2 + Math.PI *2 +_pointOne;
        }else{
          _pointOne = Math.PI/2 +_pointOne;
        }

        if(_pointTwo < -Math.PI/2){
          _pointTwo = Math.PI/2 + Math.PI*2 +_pointTwo;
        }else{
          _pointTwo = Math.PI/2 +_pointTwo;
        }

        //The value of point two should always bigger than the value
        //of point one. If the point two close to 12 oclick, we should
        //change it value close to 2PI instead of close to 0
        if(_pointTwo > 0 && _pointTwo < 0.0000001){
          _pointTwo = 2*Math.PI-_pointTwo;
        }

        if(_pointTwo < _pointOne){
          console.log('%cError: the end angle should always bigger' +
            ' than start angle.', 'color: red');
        }

        var _arcID = "arc-" +_fatherID+"-"+(Number(_childID)-1);
        var _arc = d3.svg.arc()
          .innerRadius(_r + 3)
          .outerRadius(_r + 5)
          .startAngle(_pointOne)
          .endAngle(_pointTwo);

        d3.select("#" + v.opts.chartId + " svg g").append("path")
          .attr("d", _arc)
          .attr('fill',_fill)
          .attr('id',_arcID)
          .attr('class','mark');
      }
    }

    function pieLabelMouseEnter(data) {
      var childID = Number(data.index) + 1,
        fatherID = v.opts.chartId;

      $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + childID+')').css({
        'fill-opacity': '.5',
        'stroke-width': '3'
      });

      drawMarker(childID,fatherID);
    }

    function pieLabelMouseLeave(data) {
      var childID = Number(data.index) + 1;

      $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + childID+')').css({
        'fill-opacity': '1',
        'stroke-width': '1px'
      });

      removeMarker();
    }

    function initReactTable(targetId, inputData, opts) {
      var selectedRows = v.chart.filters();

      var opts_ = $.extend({
        input: inputData,
        filter: "ALL",
        download: "NONE",
        downloadFileName: "data.txt",
        showHide: false,
        hideFilter: true,
        scroller: true,
        resultInfo: false,
        groupHeader: false,
        fixedChoose: false,
        uniqueId: 'uniqueId',
        rowHeight: 25,
        tableWidth: 373,
        maxHeight: 290,
        headerHeight: 26,
        groupHeaderHeight: 40,
        autoColumnWidth: false,
        columnMaxWidth: 300,
        columnSorting: false,
        tableType: 'pieLabel',
        selectedRows: selectedRows,
        rowClickFunc: pieLabelClick
      }, opts);

      var testElement = React.createElement(EnhancedFixedDataTableSpecial, opts_);

      ReactDOM.render(testElement, document.getElementById(targetId));
    }

    function pieLabelClick(selectedData) {
      v.chart.onClick({
        key: labels[selectedData.id].name,
        value: labels[selectedData.id].value
      });
    }
  };

  iViz.view.component.PieChart.prototype = new iViz.view.component.GeneralChart('pieChart');
  iViz.view.component.PieChart.constructor = iViz.view.component.PieChart;

  // Utils designed for pie chart.
  iViz.util.pieChart = (function() {
    var util = {};
    var v = {};

    v.category = ['w1', 'h1']; // Size class name for chart

    v.labelLT = 5; // Label length threshold
    v.labelHeaderLT = 4; // Label header length threshold

    // If the name lenght bigger the threshold, it will be truncated.
    v.labelWLT = 30; // Label length threshold for wider table
    v.labelHeaderWLT = 20; // Label header length threshold for wider table

    util.getCategory = function(attr, attrKeys) {
      var category = $.extend(true, {}, v.category);
      var maxAttrL = 0;

      _.each(attrKeys, function(key) {
        if (key.length > maxAttrL) {
          maxAttrL = key.length;
        }
      });

      category[0] = maxAttrL <= v.labelLT ? 'w1' : 'w2';

      // Default settings for special attribtues.
      if (['CANCER_TYPE', 'CANCER_TYPE_DETAILED'].indexOf(attr) !== -1) {
        category[0] = 'w2';
      }

      category[1] = attrKeys.length > 10 ? 'h2' : 'h1';

      return category;
    };

    return util;
  })();
})(window.iViz,
  window.dc,
  window._,
  window.$ || window.jQuery);
