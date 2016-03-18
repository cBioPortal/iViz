var dc_charts = function (meta, data, mapping, type) {

  var settings = {
    pie_chart: {
      width: 150,
      height: 150,
      inner_radius: 15
    },
    bar_chart: {
      width: 400,
      height: 180
    },
    transitionDuration: iViz.opts.dc.transitionDuration
  };

  var filters = {}, selected_cases = [];

  var ndx = crossfilter(data);

  // ---- a separate sample/patient id chart for sync use only ----
  var _chart_invisible = iViz.bridge_chart.init(ndx, settings, type);

  // ---- automatically create charts by iterating attributes meta ----
  _.each(meta, function (_attr_obj) {

    if ($.inArray(_attr_obj.view_type, ["pie_chart", "bar_chart"]) !== -1) { //TODO: remove this, should be able to handle all view types

      var _chart_div_id = "chart-" + _attr_obj.attr_id + _attr_obj.attr_type + "-" + "-div",
          _reset_btn_id = "chart-" + _attr_obj.attr_id + _attr_obj.attr_type + "-" + "-reset",
          _chart_id = "chart-" + _attr_obj.attr_type + "_" + _attr_obj.attr_id;

      // append html element
      // TODO: replace with template
      $("#main-grid").append(
        "<div id='" + _chart_div_id + "'>" +
        "<a id='" + _reset_btn_id + "'>Reset</a>" +
        "<i class='fa fa-arrows dc-chart-drag'></i>" +
        "<div class='dc-chart' id='" + _chart_id + "'></div>" +
        "</div>"
      );
      
      // init and define dc chart instances based on chart types
      var _chart_inst;
      switch (_attr_obj.view_type) {

        case "pie_chart":

          $("#" + _chart_div_id).addClass("grid-item");
          $("#" + _chart_id).addClass("dc-pie-chart");

          var _pie_chart = new iViz.view.component.pieChart();
          var _data = $.extend(true, {}, _attr_obj);
          
          _data.ndx = ndx;
          _pie_chart.init(_data, {
            divId: _chart_id,
            width: settings.pie_chart.width,
            height: settings.pie_chart.height,
            transitionDuration: settings.transitionDuration
          });
          _chart_inst = _pie_chart.getChart();

          $("#" + _chart_id).append("<p class='text-center'>" + _attr_obj.display_name + "</p>");

          break;

        case "bar_chart":
  
          $("#" + _chart_div_id).addClass("grid-item");
          $("#" + _chart_div_id).addClass("grid-item--width2");
          $("#" + _chart_id).addClass("dc-bar-chart");
  
          _chart_inst = iViz.view.component.barChart.init(ndx, data, _attr_obj, settings, _chart_id);

          break;

        case "scatter_plots":
          break;
        case "table":
          break;

      }
      
      iViz.event.reset_all(_chart_inst, _reset_btn_id);
      iViz.event.filtered(_chart_inst, _attr_obj, filters, type);

    }

  });

  return {
    get_selected_cases: function() {
      return selected_cases;
    },
    reset: function () {
      dc.redrawAll();
      iViz.view.grid.layout();
    },
    sync: function(_selected_cases) {
      _chart_invisible.filter(null);
      _.each(_selected_cases, function(_case_id) {
        _chart_invisible.filter(_case_id);
      });
    },
    filters: function() {
      return filters;
    }
  }

};


