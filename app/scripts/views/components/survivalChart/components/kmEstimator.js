'use strict'
var kmEstimator = (function() {
  return {
    calc: function(_inputArr) {
      // calculate the survival rate for each time point
      // each item in the input already has fields: time, num at risk,
      // event/status(0-->censored)
      var _prev_value = 1; // cache for the previous value
      _.each(_inputArr, function(_inputObj) {
        if (_inputObj.status === 1) {
          _inputObj.survival_rate = _prev_value *
            ((_inputObj.num_at_risk - 1) / _inputObj.num_at_risk);
          _prev_value = _inputObj.survival_rate;
        } else if (_inputObj.status === 0) {
          // survival rate remain the same if the event is "censored"
          _inputObj.survival_rate = _prev_value;
        } else {
          // TODO: error handling
        }
      });
    }
  };
})(); // Close KmEstimator
