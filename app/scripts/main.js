var iViz = (function() {
  var settings = {
    pie_chart: {
      width: 150,
      height: 150,
      inner_radius: 15
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
            _.each(data.groups.patient.attr_meta, function(_attr_obj) {
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
            });
            _.each(data.groups.sample.attr_meta, function(_attr_obj) {
              var _attr_id = _attr_obj.attr_id;
              if (_attr_id !== "mutated_genes" && _attr_id !== "cna_details") {
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
              }
            });

            // ---- render ----
            var $grid = $('.grid').packery({
              itemSelector: '.grid-item'
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




