/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


var logRankTest = function() {

  var datum = {
      time: "",    //num of months
      num_of_failure_1: 0,
      num_of_failure_2: 0,
      num_at_risk_1: 0,
      num_at_risk_2: 0,
      expectation: 0, //(n1j / (n1j + n2j)) * (m1j + m2j)
      variance: 0
    },
    mergedArr = [],
    callBackFunc = "";
  //os: DECEASED-->1, LIVING-->0; dfs: Recurred/Progressed --> 1, Disease Free-->0
  function mergeGrps(inputGrp1, inputGrp2, _callBackFunc) {
    var _ptr_1 = 0; //index indicator/pointer for group1
    var _ptr_2 = 0; //index indicator/pointer for group2

    while(_ptr_1 < inputGrp1.length && _ptr_2 < inputGrp2.length) { //Stop when either pointer reach the end of the array
      if (inputGrp1[_ptr_1].time < inputGrp2[_ptr_2].time) {
        var _datum = jQuery.extend(true, {}, datum);
        _datum.time = inputGrp1[_ptr_1].time;
        if (inputGrp1[_ptr_1].status === "1") {
          _datum.num_of_failure_1 = 1;
          _datum.num_at_risk_1 = inputGrp1[_ptr_1].num_at_risk;
          _datum.num_at_risk_2 = inputGrp2[_ptr_2].num_at_risk;
          _ptr_1 += 1;
        } else {
          _ptr_1 += 1;
          continue;
        }
      } else if (inputGrp1[_ptr_1].time > inputGrp2[_ptr_2].time) {
        var _datum = jQuery.extend(true, {}, datum);
        _datum.time = inputGrp2[_ptr_2].time;
        if (inputGrp2[_ptr_2].status === "1") {
          _datum.num_of_failure_2 = 1;
          _datum.num_at_risk_1 = inputGrp1[_ptr_1].num_at_risk;
          _datum.num_at_risk_2 = inputGrp2[_ptr_2].num_at_risk;
          _ptr_2 += 1;
        } else {
          _ptr_2 += 1;
          continue;
        }
      } else { //events occur at the same time point
        var _datum = jQuery.extend(true, {}, datum);
        _datum.time = inputGrp1[_ptr_1].time;
        if (inputGrp1[_ptr_1].status === "1" || inputGrp2[_ptr_2].status === "1") {
          if (inputGrp1[_ptr_1].status === "1") {
            _datum.num_of_failure_1 = 1;
          }
          if (inputGrp2[_ptr_2].status === "1") {
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
    calcExpection(_callBackFunc);
  }

  function calcExpection(_callBackFunc) {
    $.each(mergedArr, function(index, _item) {
      _item.expectation = (_item.num_at_risk_1 / (_item.num_at_risk_1 + _item.num_at_risk_2)) * (_item.num_of_failure_1 + _item.num_of_failure_2);
    });
    calcVariance(_callBackFunc);
  }

  function calcVariance(_callBackFunc) {
    $.each(mergedArr, function(index, _item) {
      var _num_of_failures = _item.num_of_failure_1 + _item.num_of_failure_2;
      var _num_at_risk = _item.num_at_risk_1 + _item.num_at_risk_2;
      _item.variance = ( _num_of_failures * (_num_at_risk - _num_of_failures) * _item.num_at_risk_1 * _item.num_at_risk_2) / ((_num_at_risk * _num_at_risk) * (_num_at_risk - 1));
    });
    calcPval(_callBackFunc);
  }

  function calcPval(_callBackFunc) {
    var O1 = 0, E1 = 0, V = 0;
    $.each(mergedArr, function(index, obj) {
      O1 += obj.num_of_failure_1;
      E1 += obj.expectation;
      V += obj.variance;
    });
    var chi_square_score = (O1 - E1) * (O1 - E1) / V;
    $.post( "calcPval.do", { chi_square_score: chi_square_score })
      .done( function(_data) {
        callBackFunc = _callBackFunc;
        callBackFunc(_data);
      });
  }

  return {
    calc: function(inputGrp1, inputGrp2, _callBackFunc) {
      mergedArr.length = 0;
      mergeGrps(inputGrp1, inputGrp2, _callBackFunc);
      //calcExpection(_callBackFunc);
      //calcVariance();
      //calcPval(_callBackFunc);
    }
  };
};