'use strict';
var LogRankTest = (function(jStat) {
  var datum = {
    time: '',  // num of months
    num_of_failure_1: 0,
    num_of_failure_2: 0,
    num_at_risk_1: 0,
    num_at_risk_2: 0,
    expectation: 0, // (n1j / (n1j + n2j)) * (m1j + m2j)
    variance: 0
  };
  var mergedArr = [];

  // os: DECEASED-->1, LIVING-->0; dfs: Recurred/Progressed --> 1,
  // Disease Free-->0
  function mergeGrps(inputGrp1, inputGrp2) {
    var _ptr_1 = 0; // index indicator/pointer for group1
    var _ptr_2 = 0; // index indicator/pointer for group2

    // Stop when either pointer reach the end of the array
    while (_ptr_1 < inputGrp1.length && _ptr_2 < inputGrp2.length) {
      var _datum;
      if (inputGrp1[_ptr_1].time < inputGrp2[_ptr_2].time) {
        _datum = jQuery.extend(true, {}, datum);
        _datum.time = inputGrp1[_ptr_1].time;
        if (inputGrp1[_ptr_1].status === 1) {
          _datum.num_of_failure_1 = 1;
          _datum.num_at_risk_1 = inputGrp1[_ptr_1].num_at_risk;
          _datum.num_at_risk_2 = inputGrp2[_ptr_2].num_at_risk;
          _ptr_1 += 1;
        } else {
          _ptr_1 += 1;
          continue;
        }
      } else if (inputGrp1[_ptr_1].time > inputGrp2[_ptr_2].time) {
        _datum = jQuery.extend(true, {}, datum);
        _datum.time = inputGrp2[_ptr_2].time;
        if (inputGrp2[_ptr_2].status === 1) {
          _datum.num_of_failure_2 = 1;
          _datum.num_at_risk_1 = inputGrp1[_ptr_1].num_at_risk;
          _datum.num_at_risk_2 = inputGrp2[_ptr_2].num_at_risk;
          _ptr_2 += 1;
        } else {
          _ptr_2 += 1;
          continue;
        }
      } else { // events occur at the same time point
        _datum = jQuery.extend(true, {}, datum);
        _datum.time = inputGrp1[_ptr_1].time;
        if (inputGrp1[_ptr_1].status === 1 || inputGrp2[_ptr_2].status === 1) {
          if (inputGrp1[_ptr_1].status === 1) {
            _datum.num_of_failure_1 = 1;
          }
          if (inputGrp2[_ptr_2].status === 1) {
            _datum.num_of_failure_2 = 1;
          }
          _datum.num_at_risk_1 = inputGrp1[_ptr_1].num_at_risk;
          _datum.num_at_risk_2 = inputGrp2[_ptr_2].num_at_risk;
          _ptr_1 += 1;
          _ptr_2 += 1;
        } else {
          _ptr_1 += 1;
          _ptr_2 += 1;
          continue;
        }
      }
      mergedArr.push(_datum);
    }
  }

  function calcExpection() {
    $.each(mergedArr, function(index, _item) {
      _item.expectation =
        (_item.num_at_risk_1 / (_item.num_at_risk_1 + _item.num_at_risk_2)) *
        (_item.num_of_failure_1 + _item.num_of_failure_2);
    });
  }

  function calcVariance() {
    $.each(mergedArr, function(index, _item) {
      var _num_of_failures = _item.num_of_failure_1 + _item.num_of_failure_2;
      var _num_at_risk = _item.num_at_risk_1 + _item.num_at_risk_2;
      _item.variance =
        (
          _num_of_failures * (_num_at_risk - _num_of_failures) *
          _item.num_at_risk_1 * _item.num_at_risk_2
        ) / ((_num_at_risk * _num_at_risk) * (_num_at_risk - 1));
    });
  }

  function calcPval() {
    var O1 = 0;
    var E1 = 0;
    var V = 0;
    $.each(mergedArr, function(index, obj) {
      O1 += obj.num_of_failure_1;
      E1 += obj.expectation;
      V += obj.variance;
    });
    var chi_square_score = (O1 - E1) * (O1 - E1) / V;
    var _pVal = jStat.chisquare.cdf(chi_square_score, 1);
    return _pVal;
  }

  return {
    calc: function(inputGrp1, inputGrp2) {
      mergedArr.length = 0;
      mergeGrps(inputGrp1, inputGrp2);
      calcExpection();
      calcVariance();
      return calcPval();
    }
  };
}(
  window.jStat
));
