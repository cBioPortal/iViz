/**
 * @author suny1@mskcc.org on 3/15/16.
 */

'use strict';
(function(iViz, dc, _) {
  iViz.event = {};
  iViz.shared = {};

  iViz.shared.resetAll = function(_chartInst, _groupid, _attributes) {
    if ((_attributes !== undefined) &&
      (_attributes.view_type === 'scatter_plot')) {
      _chartInst.reset();
    } else if (_chartInst.filters().length > 0) {
      _chartInst.filterAll();
      dc.redrawAll(_groupid);
    }
  };

  iViz.shared.updateFilters = function(filter, filters, type) {
    if (filter === null) {
      filters = [];
    } else if (type === 'bar_chart') {
      // delay event trigger for bar charts
      dc.events.trigger(function() {
        filters = filter;
      }, 0);
    } else if (type === 'pie_chart') {
      // add filter
      if (filter instanceof Array) {
        filters = filter;
      } else if ($.inArray(filter, filters) === -1) {
        filters.push(filter);
        // remove filter
      } else {
        filters = _.filter(filters, function(d) {
          return d !== filter;
        });
      }
    }
    return filters;
  };
})(window.iViz, window.dc, window._);
