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
(function(iViz, dc){
  
    iViz.event = {};
  
    iViz.event.resetAll = function(chartInst, resetBtnId) {
      d3.select('a#' + resetBtnId).on('click', function () {
        chartInst.filterAll();
        dc.redrawAll();
      });
    }  
  
    iViz.event.filtered = function(chartInst, attrObj, filters, type) {
      chartInst.on('filtered', function (_chartInst, filter) {
        
        if (filter === null) { //filter comes in as null when clicking 'reset'
          
          // remove all filters applied to this particular attribute
          filters[attrObj.attr_id] = [];
          filters[attrObj.attr_id].length = 0;
          delete filters[attrObj.attr_id];
          
          // call callback function to handle the sync between chart groups
          iViz.sync.callBack(type === 'patient' ? 'sample' : 'patient');
          
        } else {
          
          if (attrObj.view_type === 'bar_chart') {
            
            //delay event trigger for bar charts
            dc.events.trigger(function() {
              filters[attrObj.attr_id] = filter;
              
              // call callback function to handle the sync between chart groups
              iViz.sync.callBack(type === 'patient' ? 'sample' : 'patient');
            }, 0);
            
          } else if (attrObj.view_type === 'pie_chart') {
            
            // update existing filter category
            if (filters.hasOwnProperty(attrObj.attr_id)) {
              //add filter
              if ($.inArray(filter, filters[attrObj.attr_id]) === -1) {
                filters[attrObj.attr_id].push(filter);
                //remove filter
              } else {
                filters[attrObj.attr_id] = _.filter(filters[attrObj.attr_id], function (d) {
                  return d !== filter;
                });
                if (filters[attrObj.attr_id].length === 0) {
                  delete filters[attrObj.attr_id];
                }
              }
              
            } else {
              // add new filter category
              filters[attrObj.attr_id] = [filter];
            }
            
            // call callback function to handle the sync between chart groups
            iViz.sync.callBack(type === 'patient' ? 'sample' : 'patient');
            
          }
        }
        
      }); // --- closing active filter recording
    }  

} (window.iViz, window.dc));
