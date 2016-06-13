/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an 'as is' basis, and Memorial Sloan-Kettering Cancer Center has no
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

/**
 * Created by Yichao Sun on 5/18/16.
 */

'use strict';
(function (iViz) {
  iViz.view.component.survival = function () {
    var content_ = {}, data_= {}, chartInst_ = {};
    content_.init = function (_data, _chartId, _attrId) { //_attrId here indicates chart type (OS or DFS)
      $('#' + _chartId).empty();
      data_ = _data;
      var _dataProxy = new survivalChartProxy(_data, _attrId);
      this.chartInst_ = new survivalCurve(_chartId, _dataProxy.get());
    };
    content_.update = function(_selectedPatients, _chartId, _attrId) {
      // remove previous curves
      this.chartInst_.removeCurves();
      // settings for selected samples curve
      var _selectedData = _.filter(data_, function(_dataObj) { return $.inArray(_dataObj.patient_id, _selectedPatients) !== -1; });
      var _selectedDateProxy = new survivalChartProxy(_selectedData, _attrId);
      var _curveOptsSelected = jQuery.extend(true, {}, survivalBroilerPlate.subGroupSettings);
      _curveOptsSelected.line_color = "red";
      // settings for unselected samples curve
      var _unselectedData = _.filter(data_, function(_dataObj) { return $.inArray(_dataObj.patient_id, _selectedPatients) === -1; });
      var _unselectedDataProxy = new survivalChartProxy(_unselectedData, _attrId);
      var _curveOptsUnselected = jQuery.extend(true, {}, survivalBroilerPlate.subGroupSettings);
      _curveOptsUnselected.line_color = "#006bb3";
      // add curves
      this.chartInst_.addCurve(_selectedDateProxy.get(), _curveOptsSelected);
      this.chartInst_.addCurve(_unselectedDataProxy.get(), _curveOptsUnselected);
    }
    return content_;
  };
  iViz.util.scatterPlot = (function () {
  })();
})(window.iViz);
