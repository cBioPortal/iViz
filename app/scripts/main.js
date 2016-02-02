var iViz = (function() {
  var settings = {
    pie_chart: {
      width: 150,
      height: 150,
      inner_radius: 15
    },
    bar_chart: {
      width: 400,
      height: 180
    }
  };
    return {
      init: function() {
        $.ajax({url: "data/converted/ucec_tcga.json"})
          .then(function (data) {

            // ---- data processing ----
            var patient_data = data.groups.patient.data,
              sample_data = data.groups.sample.data;
            var ndx_patient = crossfilter(patient_data),
              ndx_sample = crossfilter(sample_data);

            // ---- fill the empty slots in the matrix
            _.each(patient_data, function(_data_obj) {
              _.each(_.pluck(data.groups.patient.attr_meta, "attr_id"), function(_attr_id) {
                if (!_data_obj.hasOwnProperty(_attr_id)) {
                  _data_obj[_attr_id] = "NA";
                }
              });
              _.each(_.pluck(data.groups.sample.attr_meta, "attr_id"), function(_attr_id) {
                if (!_data_obj.hasOwnProperty(_attr_id)) {
                  _data_obj[_attr_id] = "NA";
                }
              });
            });

            // ---- define charts ----

            //// ---- patient charts ----

            _.each(data.groups.patient.attr_meta, function(_attr_obj) {

              if (_attr_obj.view_type === "pie_chart") {

                var _attr_id = _attr_obj.attr_id;
                var _dim = ndx_patient.dimension(function(d) { return d[_attr_id]; });
                var _countPerFunc = _dim.group().reduceCount();

                $("#main-grid").append(
                  "<div class='grid-item'>" +
                  "<p class='text-center'>" + _attr_obj.display_name + "</p>" +
                  "<div class='dc-chart dc-bar-chart' id='chart-ring-patient-" + _attr_id + "'></div></div>");

                var _chart = dc.pieChart("#chart-ring-patient-" + _attr_id);

                _chart.width(settings.pie_chart.width)
                  .height(settings.pie_chart.height)
                  .dimension(_dim)
                  .group(_countPerFunc)
                  .innerRadius(settings.pie_chart.inner_radius);

              } else if (_attr_obj.view_type === "bar_chart") {

                var _attr_id = _attr_obj.attr_id;
                var _dim = ndx_patient.dimension(function(d) { return d[_attr_id]; });
                var _countPerFunc = _dim.group().reduceCount();

                var _bar_chart_data = _.map(_.filter(_.pluck(patient_data, _attr_id), function(d) { return d !== "NA"}), function(d) { return parseFloat(d); });

                $("#main-grid").append(
                  "<div class='grid-item grid-item--width2'>" +
                  "<div class='dc-chart dc-bar-chart' id='chart-bar-patient-" + _attr_id + "'></div></div>");

                  var _chart = dc.barChart("#chart-bar-patient-" + _attr_id);

                  _chart.width(400)
                    .height(180)
                    .gap(2)
                    .dimension(_dim)
                    .group(_countPerFunc)
                    .x(d3.scale.linear().domain([d3.min(_bar_chart_data), d3.max(_bar_chart_data)]))
                    .elasticY(true)
                    .centerBar(true)
                    .xAxisLabel(_attr_obj.display_name)
                    .margins({top: 10, right: 20, bottom: 50, left: 50});

              } else if (_attr_obj.view_type === "scatter_plots") {
                //TODO:
              } else if (_attr_obj.view_type === "table") {
                //TODO:
              } else {
                //TODO:
              }


            });
            _.each(data.groups.sample.attr_meta, function(_attr_obj) {

              if (_attr_obj.view_type === "pie_chart") {

                var _attr_id = _attr_obj.attr_id;
                var _dim = ndx_sample.dimension(function(d) { return d[_attr_id]; });
                var _countPerFunc = _dim.group().reduceCount();

                $("#main-grid").append(
                  "<div class='grid-item'>" +
                  "<p class='text-center'>" + _attr_obj.display_name + "</p>" +
                  "<div class='dc-chart dc-bar-chart' id='chart-ring-sample-" + _attr_id + "'></div></div>");

                var _chart = dc.pieChart("#chart-ring-sample-" + _attr_id);

                _chart.width(settings.pie_chart.width)
                  .height(settings.pie_chart.height)
                  .dimension(_dim)
                  .group(_countPerFunc)
                  .innerRadius(settings.pie_chart.inner_radius);

              } else if (_attr_obj.view_type === "bar_chart") {

                var _attr_id = _attr_obj.attr_id;
                var _dim = ndx_sample.dimension(function(d) { return d[_attr_id]; });
                var _countPerFunc = _dim.group().reduceCount();

                var _bar_chart_data = _.map(_.filter(_.pluck(sample_data, _attr_id), function(d) { return d !== "NA"}), function(d) { return parseFloat(d); });

                $("#main-grid").append(
                  "<div class='grid-item grid-item--width2'>" +
                  "<div class='dc-chart dc-bar-chart' id='chart-bar-sample-" + _attr_id + "'></div></div>");

                var _chart = dc.barChart("#chart-bar-sample-" + _attr_id);

                _chart.width(settings.bar_chart.width)
                  .height(settings.bar_chart.height)
                  .dimension(_dim)
                  .group(_countPerFunc)
                  .x(d3.scale.linear().domain([d3.min(_bar_chart_data) - (d3.max(_bar_chart_data) - d3.min(_bar_chart_data)) * 0.1, d3.max(_bar_chart_data)]))
                  .elasticY(true)
                  .centerBar(true)
                  .xAxisLabel(_attr_obj.display_name)
                  .margins({top: 10, right: 20, bottom: 50, left: 50});

              } else if (_attr_obj.view_type === "scatter_plots") {
                //TODO:
              } else if (_attr_obj.view_type === "table") {
                //TODO:
              } else {
                //TODO:
              }

            });

            // ---- render ----
            var $grid = $('.grid').packery({
              itemSelector: '.grid-item',
              columnWidth: 250,
              rowHeight: 250
            });
            $grid.find('.grid-item').each(function(i, gridItem) {
              var draggie = new Draggabilly(gridItem);
              $grid.packery('bindDraggabillyEvents', draggie);
            });
            dc.renderAll();

          });
      }
    }

}());




