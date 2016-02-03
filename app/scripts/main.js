var iViz = (function() {

  return {
    init: function() {
      $.ajax({url: "data/converted/ucec_tcga.json"})
        .then(function (data) {

          _.each(data.groups.patient.data, function(_data_obj) {
            _.each(_.pluck(data.groups.patient.attr_meta, "attr_id"), function (_attr_id) {
              if (!_data_obj.hasOwnProperty(_attr_id)) {
                _data_obj[_attr_id] = "NA";
              }
            });
          });
          _.each(data.groups.sample.data, function(_data_obj) {
            _.each(_.pluck(data.groups.sample.attr_meta, "attr_id"), function (_attr_id) {
              if (!_data_obj.hasOwnProperty(_attr_id)) {
                _data_obj[_attr_id] = "NA";
              }
            });
          });

          var patient_charts = new dc_charts(data.groups.patient.attr_meta, data.groups.patient.data);
          var sample_charts = new dc_charts(data.groups.sample.attr_meta, data.groups.sample.data);

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

          $("#save_cohort_btn").click(function (){
            alert(patient_charts.getFilters());
            alert(sample_charts.getFilters());
          });

          $("#import_cohort_btn").click(function (){
            alert("something!");
          });

        });
    }

  }

}());




