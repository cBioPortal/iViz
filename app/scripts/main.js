var iViz = (function() {

  var patient_charts_inst, sample_charts_inst;
  var selected_patients = [], selected_samples = [];
  var data, vm;

  var id_mapping = function(_mapping_obj, _input_cases) {
    var _selected_mapping_cases = [];
    _selected_mapping_cases.length = 0;
    _.each(_input_cases, function(_case) {
      _.each(_mapping_obj[_case], function(_id) {
        _selected_mapping_cases.push(_id);
      });
    });
    return _.uniq(_selected_mapping_cases);
  }

  return {
    init: function() {

      $("#main-grid").empty();

      $.ajax({url: "data/converted/ucec_tcga.json"})
        .then(function (_data) {

          data = _data;

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
          patient_charts_inst = new dc_charts(
            data.groups.patient.attr_meta,
            data.groups.patient.data,
            "patient",
            sync_callback_func
          );
          sample_charts_inst = new dc_charts(
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
          });

          // ---- attach event listener for importing cohort ----
          $("#import_cohort_btn").click(function (){
          });

          // ---- callback function to sync patients charts and sample charts ----
          // @selected_cases: cases selected in the other group
          // @update_type: the type of group charts (patient or sample) that needs to be updated

          selected_patients = _.pluck(data.groups.patient.data, "patient_id");
          selected_samples = _.pluck(data.groups.sample.data, "sample_id");

          function sync_callback_func (update_type) { //sel_act: add or remove (cases)

            //samples selected based only on filters
            var _dup_selected_samples_arr = [];
            _.each(Object.keys(sample_charts_inst.filters()), function(_filter_attr_id) {
              var _single_attr_selected_cases = [];
              var _filters_for_single_attr = sample_charts_inst.filters()[_filter_attr_id];
              _.each(data.groups.sample.data, function(_data_obj) {
                if (_data_obj.hasOwnProperty(_filter_attr_id)) {
                  if ($.inArray(_data_obj[_filter_attr_id], _filters_for_single_attr) !== -1) {
                    _single_attr_selected_cases.push(_data_obj.sample_id);
                  }
                }
              });
              _dup_selected_samples_arr.push(_single_attr_selected_cases);
            });
            var _selected_samples_by_filters_only = _.pluck(data.groups.sample.data, "sample_id");
            if (_dup_selected_samples_arr.length !== 0) {
              _.each(_dup_selected_samples_arr, function(_dup_selected_cases) {
                _selected_samples_by_filters_only = _.intersection(_selected_samples_by_filters_only, _dup_selected_cases);
              });
            }

            //patients selected based only on filters
            var _dup_selected_patients_arr = [];
            _.each(Object.keys(patient_charts_inst.filters()), function(_filter_attr_id) {
              var _single_attr_selected_cases = [];
              var _filters_for_single_attr = patient_charts_inst.filters()[_filter_attr_id];
              _.each(data.groups.patient.data, function(_data_obj) {
                if (_data_obj.hasOwnProperty(_filter_attr_id)) {
                  if ($.inArray(_data_obj[_filter_attr_id], _filters_for_single_attr) !== -1) {
                    _single_attr_selected_cases.push(_data_obj.patient_id);
                  }
                }
              });
              _dup_selected_patients_arr.push(_single_attr_selected_cases);
            });
            var _selected_patients_by_filters_only = _.pluck(data.groups.patient.data, "patient_id");
            if (_dup_selected_patients_arr.length !== 0) {
              _.each(_dup_selected_patients_arr, function(_dup_selected_cases) {
                _selected_patients_by_filters_only = _.intersection(_selected_patients_by_filters_only, _dup_selected_cases);
              });
            }

            // find the intersection between two groups
            var mapped_selected_samples = id_mapping(data.groups.group_mapping.patient.sample, _selected_patients_by_filters_only);
            selected_samples = _.intersection(mapped_selected_samples, _selected_samples_by_filters_only);
            selected_patients = id_mapping(data.groups.group_mapping.sample.patient, selected_samples);

            // sync view
            if (update_type === "sample") {
              sample_charts_inst.sync(id_mapping(data.groups.group_mapping.patient.sample, _selected_patients_by_filters_only));
            } else if (update_type === "patient") {
              patient_charts_inst.sync(id_mapping(data.groups.group_mapping.sample.patient, _selected_samples_by_filters_only));
            }

            // update vue
            iViz.vm().filters = [];
            iViz.vm().filters.length = 0;
            _.each(Object.keys(patient_charts_inst.filters()), function(_key) {
              iViz.vm().filters.push({ text : "<span class='label label-primary'>" + _key + ": " + iViz.patient_charts_inst().filters()[_key] + "</span>" });
            });
            _.each(Object.keys(sample_charts_inst.filters()), function(_key) {
              iViz.vm().filters.push({ text : "<span class='label label-info'>" + _key + ": " + iViz.sample_charts_inst().filters()[_key] + "</span>" });
            });
            iViz.vm().selected_samples_num = selected_samples.length;
            iViz.vm().selected_patients_num = selected_patients.length;

          } // ---- close sync callback function

          // --- using vue to show filters in header ---
          if (typeof vm === "undefined") {
            vm = new Vue({
              el: '#main-header',
              data: {
                filters: [],
                selected_samples_num: _.pluck(data.groups.sample.data, "sample_id").length,
                selected_patients_num: _.pluck(data.groups.patient.data, "patient_id").length
              }
            });
          } else {
            vm.filters = [];
            vm.selected_samples_num = _.pluck(data.groups.sample.data, "sample_id").length;
            vm.selected_patients_num = _.pluck(data.groups.patient.data, "patient_id").length
          }

        });
    }, // ---- close init function ----

    patient_filters: function() {
      return patient_charts_inst.filters();
    },
    sample_filters: function() {
      return sample_charts_inst.filters();
    },
    selected_cases: function() {

      var _result = [];

      _.each(selected_samples, function(_selected_sample) {

        var _index = data.groups.sample.data_indices.sample_id[_selected_sample];
        var _study_id = data.groups.sample.data[_index]["study_id"];

        // extract study information
        if ($.inArray(_study_id, _.pluck(_result, "studyID")) !== -1) {
          _.each(_result, function(_result_obj) {
            if (_result_obj["studyID"] === _study_id) {
              _result_obj["samples"].push(_selected_sample);
            }
          });
        } else {
          _result.push({"studyID": _study_id, "samples": [_selected_sample]});
        }

        //map samples to patients
        _.each(_result, function(_result_obj) {
          _result_obj["patients"] = id_mapping(data.groups.group_mapping.sample.patient, _result_obj["samples"]);
        });

      });

      return _result;

    },
    vm: function() {
      return vm;
    },
    patient_charts_inst: function() {
      return patient_charts_inst;
    },
    sample_charts_inst: function() {
      return sample_charts_inst;
    }

  }

}());




