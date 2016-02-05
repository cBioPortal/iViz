var iViz = (function() {

  return {
    init: function() {

      $("#main-grid").empty();

      $.ajax({url: "data/converted/ucec_tcga.json"})
        .then(function (data) {

          // ---- fill the empty slots in the data matrix ----
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

          // ----  init and define dc chart instances ----
          var patient_charts_inst = new dc_charts(
            data.groups.patient.attr_meta,
            data.groups.patient.data,
            "patient",
            sync_callback_func
          );
          var sample_charts_inst = new dc_charts(
            data.groups.sample.attr_meta,
            data.groups.sample.data,
            "sample",
            sync_callback_func
          );

          // ---- render dc charts ----
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

          // ---- attach event listener for saving cohort ----
          $("#save_cohort_btn").click(function (){
            alert(patient_charts_inst.filters());
            alert(sample_charts_inst.filters());
            alert(patient_charts_inst.get_selected_cases());
            alert(sample_charts_inst.get_selected_cases());
          });

          // ---- attach event listener for importing cohort ----
          $("#import_cohort_btn").click(function (){
            alert("something!");
          });

          // ---- callback function to sync patients charts and sample charts ----
          // @selected_cases: cases selected in the other group
          // @update_type: the type of group charts (patient or sample) that needs to be updated
          function sync_callback_func (selected_cases, update_type) {

            //map case ids: patient <-> sample
            var _selected_mapping_cases = [];
            _selected_mapping_cases.length = 0;
            if (update_type === "patient") {
              var _mapping_obj = data.groups.group_mapping.sample.patient;
            } else if (update_type === "sample") {
              var _mapping_obj = data.groups.group_mapping.patient.sample;
            }
            _.each(selected_cases, function(_case) {
              _.each(_mapping_obj[_case], function(_id) {
                _selected_mapping_cases.push(_id);
              });
            });
            _selected_mapping_cases = _.uniq(_selected_mapping_cases);

            if (update_type === "patient") {
              patient_charts_inst.sync(_selected_mapping_cases);
            } else if (update_type === "sample") {
              sample_charts_inst.sync(_selected_mapping_cases);
            }

          }


        });
    }

  }

}());




