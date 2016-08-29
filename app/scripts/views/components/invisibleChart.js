/**
 * Created by kalletlak on 8/10/16.
 */

'use strict';
(function($, dc) {
  iViz.invisibleChart = function(dimension,chartId,groupId) {
    var _chartInvisible = dc.pieChart('#' + chartId, groupId);
    _chartInvisible.width(0)
      .height(0)
      .dimension(dimension)
      .group(dimension.group().reduceCount())
      .innerRadius(0);
    return _chartInvisible;
  };
}(window.$, window.dc));