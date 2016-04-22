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
 * @author suny1@mskcc.org on 3/15/16.
 */

'use strict';
(function(iViz, dc) {

  iViz.event = {};
  iViz.shared = {};

  iViz.shared.resetAll = function(chartInst,groupid) {
    chartInst.filterAll();
    dc.redrawAll(groupid);
  }
  iViz.shared.updateFilters = function(filter, filters, attribute, type) {
    if (filter === null) {
      filters = [];
    } else {
      if (type === 'bar_chart') {
        //delay event trigger for bar charts
        dc.events.trigger(function() {
          filters = filter
        }, 0);
      } else if (type === 'pie_chart') {
          //add filter
        if ($.inArray(filter, filters) === -1) {
          filters.push(filter);
          //remove filter
        } else {
          filters = _.filter(filters, function(d) {
            return d !== filter;
          });
        }
      }
    }
    return filters
  }
}(window.iViz, window.dc));
