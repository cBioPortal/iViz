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
  iViz.view.component.pieChart = function() {
    var content = {};
    var v = {};

    v.chart = '';

    v.data = {
      color: $.extend(true, [], iViz.util.getColors()),
      category: ''
    };

    /* HTML options*/
    v.opts = {};

    var labels = [];
    var currentSampleSize = 0;
    var reactTableData = {};
    var pieLabelTableInitialized = false;
    var tableInitialized = false;
    var labelMetaData = [];
    var maxLabelValue = 0;
    var currentView = 'pie';

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
        var attr = v.data.attr_id;
        var cluster = v.data.ndx.dimension(function(d) {
          return d[attr];
        });

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

        v.chart
          .width(width)
          .height(height)
          .radius(radius)
          .dimension(cluster)
          .group(cluster.group())
          .transitionDuration(v.opts.transitionDuration || 400)
          .ordinalColors(color)
          .label(function(d) {
            return d.value;
          })
          .ordering(function(d) {
            return d.key;
          });
        v.chart.on("postRender",function(){
          initLabels();
          initReactData();
        });
        v.chart.on("preRedraw",function(){
          removeMarker();
        });
        v.chart.on("postRedraw",function(){
          if ( $("#"+v.opts.charDivId).length ) {
            updatePieLabels();
          }
        });
      } else {
        // TODO:
        /**
         * Need a handler if no dimension ID passed.
         */
      }
    }

    content.init = function(ndx, attributes, opts) {
      v.opts = $.extend(true, v.opts, opts);
      v.data = $.extend(true, v.data, attributes);
      v.data.ndx = ndx;

      initDCPieChart();

      return v.chart;
    };

    content.getChart = function() {
      return v.chart;
    };

    content.changeView = function(vm,toTableView){
      currentView = toTableView?'table':'pie';
      var chartDivDom = $("#"+v.opts.charDivId);
      chartDivDom.css('z-index', 16000);

      //qtip wont be needed in table view
      chartDivDom.qtip('destroy', true);

      if(currentView === 'table'){
        if ( !tableInitialized ) {
          initReactTable(v.opts.chartTableId, reactTableData);
          tableInitialized = true;
        }else{
          updateReactTable();
        }
        animateTable("#"+v.opts.charDivId, 'table', function() {
          vm.$dispatch('update-grid');
          $("#"+v.opts.charDivId).css('z-index', '');
        });
      }else{
        animateTable("#"+v.opts.charDivId, 'pie', function() {
          vm.$dispatch('update-grid');
          $("#"+v.opts.charDivId).css('z-index', '1');
        });
        content.initMainDivQtip();
      }
    };

    content.initMainDivQtip = function(){
      $('#' +v.opts.charDivId).qtip({
        id: v.opts.charDivId+'-qtip',
        style: {
          classes: 'qtip-light qtip-rounded qtip-shadow forceZindex qtip-max-width iviz-pie-qtip iviz-pie-label-qtip'
        },
        show: {event: "mouseover", solo: true, delay: 0, ready: true},
        hide: {fixed:true, delay: 300, event: "mouseleave"},
        // hide: false,
        position: {my:'left center',at:'center right', viewport: $(window)},
        content: '<div id="qtip-' + v.opts.charDivId + '-content-react">Loading....</div>',
        events: {
          render: function() {
            updateCurrentLabels();
            initReactData();
            var data = $.extend(true, {}, reactTableData);
            data.attributes[0].column_width = 140;
            initReactTable('qtip-' + v.opts.charDivId + '-content-react',
              data, {
                tableWidth: 300,
                pieLabelMouseEnterFunc: pieLabelMouseEnter,
                pieLabelMouseLeaveFunc: pieLabelMouseLeave
              });
            pieLabelTableInitialized = true;
          }
        }
      });
    };

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

    function initLabels() {
      labelMetaData = initLabelInfo();
      labels = $.extend(true, [] , labelMetaData);
    }

    function initLabelInfo() {
      var _labelID = 0;
      var _labels = [];
      currentSampleSize = 0;

      $('#' + v.opts.chartId + '>svg>g>g').each(function(){
        var _labelDatum = {};
        var _labelText = $(this).find('title').text();
        var _color = $(this).find('path').attr('fill');
        var _pointsInfo = $(this).find('path').attr('d').split(/[\s,MLHVCSQTAZ]/);
        var _labelName = _labelText.substring(0, _labelText.lastIndexOf(":"));
        var _labelValue = Number(_labelText.substring(_labelText.lastIndexOf(":")+1).trim());

        if(_pointsInfo.length >= 10){

          var _x1 = Number( _pointsInfo[1] ),
            _y1 = Number( _pointsInfo[2] ),
            _x2 = Number( _pointsInfo[8] ),
            _y2 = Number( _pointsInfo[9] );

          if(Math.abs(_x1 - _x2) > 0.01 || Math.abs(_y1 - _y2) > 0.01){
            _labelDatum.id = _labelID;
            _labelDatum.name = _labelName;
            _labelDatum.color = _color;
            _labelDatum.parentID = v.opts.chartId;
            _labelDatum.samples = _labelValue;
            currentSampleSize += _labelValue;

            if(maxLabelValue < _labelValue) {
              maxLabelValue = _labelValue;
            }
            _labels.push(_labelDatum);
          }
          _labelID++;
        }else{
          // StudyViewUtil.echoWarningMessg("Initial Label Error");
        }
      });

      return _labels;
    }

    function updatePieLabels() {
      updateCurrentLabels();
      initReactData();
      updateTables();
    }

    function updateTables() {
      if(pieLabelTableInitialized && currentView === 'pie') {
        updateQtipReactTable();
      }
      if(tableInitialized && currentView === 'table') {
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
      initReactTable('qtip-' + v.opts.charDivId + '-content-react', data, {
        tableWidth: 300,
        pieLabelMouseEnterFunc: pieLabelMouseEnter,
        pieLabelMouseLeaveFunc: pieLabelMouseLeave
      });
    }


    function updateCurrentLabels() {
      labels = filterLabels();
    }

    function findLabel(labelName) {
      for (var i = 0; i < labelMetaData.length; i++) {
        if (labelMetaData[i].name === labelName) {
          return labelMetaData[i];
        }
      }
      return '';
    }

    function filterLabels() {
      var _labels = [];
      currentSampleSize = 0;

      $('#' + v.opts.chartId + '>svg>g>g').each(function(){
        var _labelText = $(this).find('title').text();
        var _pointsInfo = $(this).find('path').attr('d').split(/[\s,MLHVCSQTAZ]/);
        var _labelName = _labelText.substring(0, _labelText.lastIndexOf(":"));
        var _labelValue = Number(_labelText.substring(_labelText.lastIndexOf(":")+1).trim());

        if(_pointsInfo.length >= 10){

          var _x1 = Number( _pointsInfo[1] ),
            _y1 = Number( _pointsInfo[2] ),
            _x2 = Number( _pointsInfo[8] ),
            _y2 = Number( _pointsInfo[9] );

          if(Math.abs(_x1 - _x2) > 0.01 || Math.abs(_y1 - _y2) > 0.01){
            var _label = findLabel(_labelName);
            if(_label) {
              _label.samples = _labelValue;
              currentSampleSize += _labelValue;
              _labels.push(_label);
            }

            if(maxLabelValue < _labelValue) {
              maxLabelValue = _labelValue;
            }
          }
        }else{
          //StudyViewUtil.echoWarningMessg("Initial Label Error");
        }
      });

      return _labels;
    }

    function initReactData() {
      var result = {
        data: [],
        attributes: [
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
        ]
      };

      _.each(labels, function(item, index) {
        for (var key in item) {
          var datum = {
            'attr_id': key,
            'uniqueId': item.id,
            'attr_val': item[key]
          };
          result.data.push(datum);
        }
        result.data.push({
          'attr_id': 'sampleRate',
          'uniqueId': item.id,
          'attr_val': ( currentSampleSize <= 0 ? 0 : (Number(item.samples) * 100 / currentSampleSize).toFixed(1).toString()) + '%'
        });
      });

      reactTableData =  result;
    }

    function removeMarker() {
      $("#" + v.opts.chartId).find('svg g .mark').remove();
    }

    function drawMarker(_childID,_fatherID) {
      var _pointsInfo =
        $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + _childID+')')
          .find('path')
          .attr('d')
          .split(/[\s,MLHVCSQTAZ]/);

      var _pointsInfo1 =
        $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + _childID+')')
          .find('path')
          .attr('d')
          .split(/[A]/);

      var _fill =
        $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + _childID+')')
          .find('path')
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
      var childID = Number(data.id) + 1,
        fatherID = v.opts.chartId;

      $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + childID+')').css({
        'fill-opacity': '.5',
        'stroke-width': '3'
      });

      drawMarker(childID,fatherID);
    }

    function pieLabelMouseLeave(data) {
      var childID = Number(data.id) + 1,
        fatherID = v.opts.chartId,
        arcID = fatherID+"-"+(Number(childID)-1);

      $("#" + v.opts.chartId + " svg g #arc-" + arcID).remove();

      $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + childID+')').css({
        'fill-opacity': '1',
        'stroke-width': '1px'
      });
    }

    function initReactTable(targetId, inputData, opts) {
      var _filters = v.chart.filters();
      var selectedRows = _.map(_.filter(labels, function(item) {
        return _.contains(_filters, item.name);
      }), function(item) {
        return item.id.toString();
      });

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

    function pieLabelClick(selectedData, selected, allSelectedData) {
      var childaLabelID = Number(selectedData.id),
        childID = childaLabelID + 1;

      var arcID =  v.opts.chartId + "-" + (Number(childID) - 1);

      v.chart.onClick({
        key: labelMetaData[childaLabelID].name,
        value: labelMetaData[childaLabelID].value
      });
      $("#" + v.opts.chartId + " svg g #" + arcID).remove();

      $('#' + v.opts.chartId + ' svg>g>g:nth-child(' + childID + ')').css({
        'fill-opacity': '1',
        'stroke-width': '1px'
      });
    }

    return content;
  };

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
