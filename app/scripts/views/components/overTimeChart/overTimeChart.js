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

'use strict';
(function(iViz, dc, _, $, d3) {
  iViz.view.component.OvertimeChart = function(ndx, opts, attributes) {
    var content = this;
    var attr_id = attributes.attr_id;
    var overtimeLineData;

    var parseDate = d3.time.format("%-m-%-d-%Y").parse; //function to parse the date string (with specific format) to a date object
    var data = iViz.getAttrData(attributes.group_type);//data is an array
    if(!(data[0][attr_id] instanceof Date)){ //ensures a Date object will not be parsed into a Date
      data.forEach(function(d){ //parse every date in the data array
        d[attr_id] = parseDate(d[attr_id]); //d[attr_id] = d.DATE_OF_DIAGNOSIS b/c attr_id is a variable
      }); //each date only has month-date-year; time is removed
    }
    var dateDimension = ndx.dimension(function(d){ //d refers to each object(the element) in the "data" array
      return d[attr_id];
    });//create date dimension
    var dateByFrequency = dateDimension.group();//create date group

    content.init = function (){
     // var chartInstances = {};
      var overtimeChartInst_ = dc.barChart(opts.overtimeBarChartTarget, opts.groupid);
      
      overtimeChartInst_.width(375).height(70) //use range chart to select the range of the line chart
        .margins({top: 10, right: 20, bottom: 25, left: 30})
        .dimension(dateDimension)
        .group(dateByFrequency)
        .centerBar(true)
        .gap(10)
        .x(d3.time.scale().domain(d3.extent(data, function(d) { return d[attr_id]; })))
        .round(d3.time.day.round)
        .alwaysUseRounding(true)
        .xUnits(d3.time.days)
        .xAxis()
        .ticks(d3.time.months, 2);
                
      return overtimeChartInst_;

    }; //lack of x axis might be because of margin
    content.generateAccumulation = function(chartInst_){
        //sortedOvertimeData contains the sorted array of dates
        var sortedOvertimeData = chartInst_.dimension().top(Infinity).sort(function(a,b){
            return a[attr_id] - b[attr_id];
        });
        console.log(chartInst_.group().top(Infinity))
        console.log(chartInst_.dimension().top(Infinity))
        var sortedOvertimeDateData = [];
        for (var i = 0;i<sortedOvertimeData.length;i++){
            sortedOvertimeDateData.push(sortedOvertimeData[i][attr_id]);
        }

         //create an array that counts the occurrence of each date; output is this: [{},{}]
        var dates = [], frequencies = [], prevElement;
        for (var j = 0; j < sortedOvertimeDateData.length; j++){
            //need to use getTime() to compare because cannot compare dates, which are objects normally
            //prevent undefined.getTime() error
            if (!(prevElement instanceof Date)){ //for the first element
                dates.push(sortedOvertimeDateData[j]);
                frequencies.push(1);
                prevElement = sortedOvertimeDateData[j];
            }
            else{
                if (sortedOvertimeDateData[j].getTime()/*current element*/ !== prevElement.getTime()){
                    dates.push(sortedOvertimeDateData[j]);
                    frequencies.push(1);
                }
                else{frequencies[frequencies.length - 1]++;
                };
                prevElement = sortedOvertimeDateData[j];
            }
        }

        //concatenate the dates and frequencies arrays into an array of objects
        var countedOvertimeDatesArray =[];
        for (var k = 0; k <dates.length; k++){
            var countedOvertimeDatesObj = {};
            countedOvertimeDatesObj.key = dates[k];
            countedOvertimeDatesObj.value = frequencies [k];
            countedOvertimeDatesArray.push(countedOvertimeDatesObj)
        }
        
        //create array of accumulated values
        var accDatesArray = [];
        for (var m = 0; m < countedOvertimeDatesArray.length; m++){
            var accDatesObj = {};
            if (countedOvertimeDatesArray [m-1] !== undefined){ //prevent addition being done on first element
                countedOvertimeDatesArray[m].value = countedOvertimeDatesArray[m].value + countedOvertimeDatesArray[m-1].value;
                }
            accDatesObj.key = countedOvertimeDatesArray[m].key;
            accDatesObj.value = countedOvertimeDatesArray[m].value;
            accDatesArray.push(accDatesObj);
        }
        return accDatesArray;
      }
    content.drawOvertimeLine = function(chartInst_){
          overtimeLineData = content.generateAccumulation(chartInst_);
        
          var margin = {top: 10, right: 10, bottom: 25, left: 40},
            width = 375 - margin.left - margin.right,
            height = 230 - margin.top - margin.bottom;

            var x = d3.time.scale()
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(3);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var line = d3.svg.line()
                .x(function(d) { return x(d.key); })
                .y(function(d) { return y(d.value); });

            var svg = d3.select(opts.overtimeLineTarget).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              x.domain(d3.extent(overtimeLineData, function(d) { return d.key; }));
              y.domain(d3.extent(overtimeLineData, function(d) { return d.value; }));

              svg.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis);

              svg.append("g")
                  .attr("class", "y axis")
                  .call(yAxis)
                .append("text")
                  .attr("transform", "rotate(-90)")
                  .attr("y", 6)
                  .attr("dy", ".71em")
                  .style("text-anchor", "end");

              svg.append("path")
                  .datum(overtimeLineData)
                  .attr("class", "line")
                  .attr("d", line);
      };
    function initTsvDownloadData(){
      var data = "";
      var _dates = overtimeLineData;
      data = attributes.display_name + "\tAccumulated Number of Patients";

      for (var i = 0; i< _dates.length; i++){
        data += "\n";
        var cleanDate = _dates[i].key.getMonth()+1 + "/" + _dates[i].key.getDate() + "/" + _dates[i].key.getFullYear();
        data += cleanDate + "\t" + _dates[i].value; //modify key
      }
      content.setDownloadData('tsv', {
        fileName: attr_id,
        data: data
      });
    };

    function initCanvasDownloadData(){
      content.setDownloadData('svg',{
        title: attributes.display_name,
        fileName: attr_id,
        chartId: opts.overtimeBarChartTarget,
        overtimeLineId: opts.overtimeLineTarget
      });
      content.setDownloadData('pdf',{
        title: attributes.display_name,
        fileName: attr_id,
        chartId: opts.lineChartTarget,
        overtimeLineId: opts.overtimeLineTarget
      });
    };

    content.updateDataForDownload = function (fileType){
      if (fileType === 'tsv'){
        initTsvDownloadData();
      } else if (['pdf','svg'].indexOf(fileType) !== -1){
        initCanvasDownloadData();
      };
    };
  };
  iViz.view.component.OvertimeChart.prototype = new iViz.view.component.GeneralChart('overtimeChart'); //prototype of linechart is a new instance of GeneralChart, but with specific functionalities of lineChart
                                                                                               //GeneralChart is defined in generalChart.js
  iViz.view.component.OvertimeChart.constructor = iViz.view.component.overtimeChart; //constructor is a property that references the function that creates the object iViz..lineChart; assigning iViz...lineChart
                                                                             //to the constructor ensures that calling it will create a new lineChart each time
})(window.iViz,
  window.dc,
  window._,
  window.$ || window.jQuery,
  window.d3);
