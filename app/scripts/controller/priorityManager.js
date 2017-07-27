/**
 * @author Hongxin Zhang on 5/12/17.
 */

/**
 * Please see Study-View.md under cBioPortal repository for more information 
 * about priority and layout.
 */


'use strict';
(function(iViz, _) {
  iViz.priorityManager = (function() {
    var content = {};
    var clinicalAttrsPriority = {};
    var defaultPriority = 1;

    /**
     * Calculate combination chart priority
     * @param {string} id Clinical attribute ID.
     * @return {array}
     */
    function getCombinationPriority(id) {
      var priority = _.clone(defaultPriority);
      if (id) {
        switch (id) {
        case 'DFS_SURVIVAL':
          var _dfsStatus = getPriority('DFS_STATUS');
          var _dfsMonths = getPriority('DFS_MONTHS');
          if (_dfsStatus === 0 || _dfsMonths === 0) {
            priority = 0;
          } else {
            priority = (_dfsMonths + _dfsStatus ) / 2;
            priority = priority > 1 ? priority :
              clinicalAttrsPriority['DFS_SURVIVAL'];
          }
          break;
        case 'OS_SURVIVAL':
          var _osStatus = getPriority('OS_STATUS');
          var _osMonths = getPriority('OS_MONTHS');
          if (_osStatus === 0 || _osMonths === 0) {
            priority = 0;
          } else {
            priority = (_osStatus + _osMonths ) / 2;
            priority = priority > 1 ? priority :
              clinicalAttrsPriority['OS_SURVIVAL'];
          }
          break;
        case 'MUT_CNT_VS_CNA':
          priority = clinicalAttrsPriority['MUT_CNT_VS_CNA'];
          break;
        }
      }
      return priority;
    }

    /**
     * Get priority by clinical attribute.
     * @param{string} id Clinical attribute ID.
     * @return {number}
     */
    function getPriority(id) {
      return clinicalAttrsPriority.hasOwnProperty(id)
        ? clinicalAttrsPriority[id] : 1;
    }

    content.comparePriorities = function(_a, _b, asc) {
      return asc ? (_a - _b) : (_b - _a);
    };

    content.getDefaultPriority = function(id, isCombinationChart) {
      var priority = _.clone(defaultPriority);
      if (!_.isBoolean(isCombinationChart)) {
        isCombinationChart = false;
      }
      if (id) {
        if (isCombinationChart) {
          priority = getCombinationPriority(id);
        } else {
          priority = clinicalAttrsPriority.hasOwnProperty(id) ?
            clinicalAttrsPriority[id] : priority;
        }
      }
      return priority;
    };

    content.setClinicalAttrPriority = function(attr, priority) {
      if (attr) {
        if (priority !== 1 || !clinicalAttrsPriority.hasOwnProperty(attr)) {
          clinicalAttrsPriority[attr] = priority;
        }
      }
    };

    content.setDefaultClinicalAttrPriorities = function(priorities) {
      if (_.isObject(priorities)) {
        _.extend(clinicalAttrsPriority, priorities);
      }
    };

    return content;
  })();
})(window.iViz,
  window._);