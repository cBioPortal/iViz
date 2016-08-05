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
 * Created by James Xu on 8/5/16.
 */
'use strict';
(function(iViz, dc, _, $, d3) {
    iViz.view.component.LineChart = function(ndx, opts, attributes){ //must import both ndx (for crossfiltered data) and data (array containing data)
        var content = this;
        var lineChartInst_;
        var rangeChartInst_;
        var attr_id = attributes.attr_id;
        
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
        
        content.init = function initDCLineChart(){
            var chartInstances = {};
            lineChartInst_ = dc.lineChart(opts.lineChartTarget, opts.groupid); //initialize line chart; random dates created in util.js
                                                                              //second parameter adds line chart to the chart group
            rangeChartInst_ = dc.barChart(opts.rangeChartTarget, opts.groupid);

            lineChartInst_.width(375).height(230)
                .dimension(dateDimension)
                .group(dateByFrequency)
                .transitionDuration(1000)
                .margins({top: 10, right: 10, bottom: 25, left: 30})
                .mouseZoomable(true)
                .brushOn(false)
                .rangeChart(rangeChartInst_)
                .x(d3.time.scale().domain(d3.extent(data, function(d) { return d[attr_id]; }))) //d3.extent uses the data array 
                                                                                                //to determine the min. and max. date to generate scale
                .round(d3.time.month.round)
                .xUnits(d3.time.months)
                .xAxis()
                .ticks(3);
                                                                                                //TODO: create line chart functionality where 15 days is combined into one data point on the line chart; the value
                                                                                                //at that date would be the sum of the values of the individual 15 days

            rangeChartInst_.width(375).height(70) //use range chart to select the range of the line chart
                .margins({top: 10, right: 10, bottom: 25, left: 30})
                .dimension(dateDimension)
                .group(dateByFrequency)
                .centerBar(true)
                .gap(10)
                .x(d3.time.scale().domain(d3.extent(data, function(d) { return d[attr_id]; })))
                .round(d3.time.day.round)
                .alwaysUseRounding(true)
                .xUnits(d3.time.days)
                .xAxis()
                .ticks(d3.time.months, 2); //show a tick every 2 months on the range chart      
//                    lineChart.render(); //no need to render the line chart after adding it to the group of charts (vuecore.js handles rendering)
       chartInstances.lineChart = lineChartInst_;
       chartInstances.rangeChart = rangeChartInst_;
        return chartInstances;
        };
        
        function initTsvDownloadData(){
            var data = "";
            var _dates = dateByFrequency.all();
            
            data = attributes.display_name + "\tNumber of Patients"; 
            
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
               chartId: opts.lineChartTarget,
               rangeChartId: opts.rangeChartTarget
            });
            content.setDownloadData('pdf',{
                title: attributes.display_name,
                fileName: attr_id,
                chartId: opts.lineChartTarget,
                rangeChartId: opts.rangeChartTarget
            });
        };
        
        content.updateDataForDownload = function (fileType){
          if (fileType === 'tsv'){
              initTsvDownloadData();
          } else if (['pdf','svg'].indexOf(fileType) !== -1){
              initCanvasDownloadData();
          }
        };
    };
    iViz.view.component.LineChart.prototype = new iViz.view.component.GeneralChart('lineChart'); //prototype of linechart is a new instance of GeneralChart, but with specific functionalities of lineChart
                                                                                                 //GeneralChart is defined in generalChart.js
    iViz.view.component.LineChart.constructor = iViz.view.component.LineChart; //constructor is a property that references the function that creates the object iViz..lineChart; assigning iViz...lineChart
                                                                               //to the constructor ensures that calling it will create a new lineChart each time
})(window.iViz,window.dc,window._,
window.$ || window.jQuery, window.d3);





