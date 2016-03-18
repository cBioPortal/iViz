/*! 
  Invisible charts functioning as bridges between different chart groups 
  Each chart group has its own invisible chart, consisting of sample/patient ids 
*/

iViz.bridge_chart = function() {
  return {
    
    init: function(ndx, settings, type) {
      var dim_hide, countPerFunc_hide;
      if (type === "patient") {
        dim_hide = ndx.dimension(function (d) { return d.patient_id; }),
          countPerFunc_hide = dim_hide.group().reduceCount();
      } else if (type === "sample") {
        dim_hide = ndx.dimension(function (d) { return d.sample_id; }),
          countPerFunc_hide = dim_hide.group().reduceCount();
      }
      $("#main-bridge").append(
        "<div class='grid-item' id='" + type + "_id_chart_div'>" +
        "<div class='dc-chart dc-pie-chart' id='" + type +"_id_chart'></div>" +
        "</div>"
      );
      var _chart_invisible = dc.pieChart("#" + type + "_id_chart");
      _chart_invisible.width(settings.pie_chart.width)
        .height(settings.pie_chart.height)
        .dimension(dim_hide)
        .group(countPerFunc_hide)
        .innerRadius(settings.pie_chart.inner_radius);
      return _chart_invisible;
    }

  }
}();