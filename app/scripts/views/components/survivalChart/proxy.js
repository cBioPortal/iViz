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

var survivalChartProxy = function (_data, _attrId) { //_attrId here indicates chart type: DFS_SURVIVAL or OS_SURVIVAL

  var datum_ = {
      study_id: "",
      patient_id: "",
      time: "",    //num of months
      status: "", 
      num_at_risk: -1,
      survival_rate: 0
    },
    datumArr_ = [];

  // convert raw data
  var _totalNum = 0;
  _.each(_data, function (_dataObj) {
    var _status, _time;
    if (_attrId === 'DFS_SURVIVAL') {
      _time = _dataObj.DFS_MONTHS;
      _status = _dataObj.DFS_STATUS;
    } else if (_attrId === 'OS_SURVIVAL') {
      _time = _dataObj.OS_MONTHS;
      _status = _dataObj.OS_STATUS;
    }
    if (_time !== 'NaN' && _time !== 'NA' &&
    _status !== 'NaN' && _status !== 'NA' &&
    typeof _status !== 'undefined' && typeof _time !== 'undefined') {
      var _datum = jQuery.extend(true, {}, datum_);
      _datum.patient_id = _dataObj.patient_id;
      _datum.study_id = _dataObj.study_id;
      _datum.time = parseFloat(_time);
      _datum.status = _status;
      datumArr_.push(_datum);
      _totalNum += 1;
    }
  });
  
  // convert status from string to number
  // os: DECEASED-->1, LIVING-->0; dfs: Recurred/Progressed --> 1, Disease Free-->0
  _.each(datumArr_, function(_datumObj) {
    var _status = _datumObj.status.toString().toLowerCase();
    if (_status === 'deceased' || _status === 'recurred/progressed' || _status === 'recurred') {
      _datumObj.status = 1;
    } else if (_status === 'living' || _status === 'disease free' || _status === 'diseasefree') {
      _datumObj.status = 0;
    }
  });
  
  // calculate num at risk
  datumArr_ = _.sortBy(datumArr_, 'time');
  for (var i in datumArr_) {
    datumArr_[i].num_at_risk = _totalNum;
    _totalNum += -1;
  }
  
  // calculate survival rate
  kmEstimator.calc(datumArr_);

  return {
    get: function() {
      return datumArr_;
    }
  }
};