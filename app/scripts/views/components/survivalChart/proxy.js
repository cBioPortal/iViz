'use strict';
/**
 * Data proxy for survival chart.
 *
 * @param {array} _data Data
 * @param {string} _attrId Chart type: DFS_SURVIVAL or OS_SURVIVAL
 * @return {object} APIs
 */
var survivalChartProxy = function(_data, _attrId) {
  var datum_ = {
    study_id: '',
    patient_id: '',
    time: '', // num of months
    status: '',
    num_at_risk: -1,
    survival_rate: 0
  };
  var datumArr_ = [];

  // convert raw data
  var _totalNum = 0;
  _.each(_data, function(_dataObj) {
    var _status;
    var _time;
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
    if (_status === 'deceased' || _status === 'recurred/progressed' ||
      _status === 'recurred') {
      _datumObj.status = 1;
    } else if (_status === 'living' || _status === 'disease free' ||
      _status === 'diseasefree') {
      _datumObj.status = 0;
    }
  });

  // calculate num at risk
  datumArr_ = _.sortBy(datumArr_, 'time');
  for (var i in datumArr_) {
    if (datumArr_.hasOwnProperty(i)) {
      datumArr_[i].num_at_risk = _totalNum;
      _totalNum += -1;
    }
  }

  // calculate survival rate
  kmEstimator.calc(datumArr_);

  return {
    get: function() {
      return datumArr_;
    }
  };
};
