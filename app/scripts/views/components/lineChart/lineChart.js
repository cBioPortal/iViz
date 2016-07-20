'use strict';
(function(iViz, dc, _, $, d3) {
    iViz.view.component.lineChart = function(ndx, data){ //must import both ndx (for crossfiltered data) and data (array containing data)
        var content = {};
        content.init = function initDCLineChart(){
                    var lineChart = dc.lineChart("#line-chart"); //initialize line chart; random dates created in util.js         
                         
                    var parseDate = d3.time.format("%-m-%-d-%Y").parse; //function to parse the date string (with specific format) to a date object
                    data.forEach(function(d){ //parse every date in the data array
                        d.DATE_OF_DIAGNOSIS = parseDate(d.DATE_OF_DIAGNOSIS);
                    }); //each date only has month-date-year; time is removed
                    
                    var dateDimension = ndx.dimension(function(d){ //d refers to each object(the element) in the "data" array
                        return d.DATE_OF_DIAGNOSIS;
                    });//create date dimension
                                        
                    var dateByFrequency = dateDimension.group();//create date group
                    
                    lineChart.width(400).height(300)
                            .dimension(dateDimension)
                                .group(dateByFrequency)
                            .transitionDuration(1000)
                            .margins({top: 30, right: 50, bottom: 25, left: 40})
                            .mouseZoomable(true)
                            .elasticY(true)
                            .x(d3.time.scale().domain(d3.extent(data, function(d) { return d.DATE_OF_DIAGNOSIS; }))) //d3.extent uses the data array 
                                                                                                                     //to determine the min. and max. date to generate scale
                            .xAxis();

                    lineChart.render(); //need to render to draw the actual chart
                };
        return content;
    };
})(window.iViz,window.dc,window._,
window.$ || window.jQuery, window.d3);





