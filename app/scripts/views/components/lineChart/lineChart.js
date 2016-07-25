'use strict';
(function(iViz, dc, _, $, d3) {
    iViz.view.component.lineChart = function(ndx, data, opts){ //must import both ndx (for crossfiltered data) and data (array containing data)
        var content = {};
        content.init = function initDCLineChart(){
                    var lineChart = dc.lineChart(opts.lineChartTarget, opts.groupid); //initialize line chart; random dates created in util.js
                                                                               //second parameter adds line chart to the chart group
                    
                    var rangeChart = dc.barChart(opts.rangeChartTarget, opts.groupid);
                    
                    var parseDate = d3.time.format("%-m-%-d-%Y").parse; //function to parse the date string (with specific format) to a date object
                    data.forEach(function(d){ //parse every date in the data array
                        d.DATE_OF_DIAGNOSIS = parseDate(d.DATE_OF_DIAGNOSIS);
                    }); //each date only has month-date-year; time is removed
                    
                    var dateDimension = ndx.dimension(function(d){ //d refers to each object(the element) in the "data" array
                        return d.DATE_OF_DIAGNOSIS;
                    });//create date dimension
                                        
                    var dateByFrequency = dateDimension.group();//create date group
                    
                 
                    lineChart.width(375).height(230)
                        .dimension(dateDimension)
                        .group(dateByFrequency)
                        .transitionDuration(1000)
                        .margins({top: 10, right: 10, bottom: 25, left: 30})
                        .mouseZoomable(true)
                        .brushOn(false)
                        .elasticY(true)
                        .rangeChart(rangeChart)
                        .x(d3.time.scale().domain(d3.extent(data, function(d) { return d.DATE_OF_DIAGNOSIS; }))) //d3.extent uses the data array 
                                                                                                                 //to determine the min. and max. date to generate scale
                        .round(d3.time.month.round)
                        .xUnits(d3.time.months)
                        .xAxis()
                        .ticks(3);
                        //TODO: create line chart functionality where 15 days is combined into one data point on the line chart; the value
                        //at that date would be the sum of the values of the individual 15 days
                            
                    rangeChart.width(375).height(70) //use range chart to select the range of the line chart
                        .margins({top: 10, right: 10, bottom: 25, left: 30})
                        .dimension(dateDimension)
                        .group(dateByFrequency)
                        .centerBar(true)
                        .gap(10)
                        .x(d3.time.scale().domain(d3.extent(data, function(d) { return d.DATE_OF_DIAGNOSIS; })))
                        .round(d3.time.day.round)
                        .alwaysUseRounding(true)
                        .xUnits(d3.time.days)
                        .xAxis()
                        .ticks(d3.time.months, 2); //show a tick every 2 months on the range chart      
//                    lineChart.render(); //no need to render the line chart after adding it to the group of charts (vuecore.js handles rendering)
                };
        return content;
    };
    iViz.view.component.lineChart.prototype = new iViz.view.component.GeneralChart('lineChart');
    iViz.view.component.lineChart.constructor = iViz.view.component.lineChart;
})(window.iViz,window.dc,window._,
window.$ || window.jQuery, window.d3);





