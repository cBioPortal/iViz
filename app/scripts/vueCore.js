'use strict';
(function(Vue, iViz, dc, _) {
  iViz.vue = {};

  iViz.vue.manage = (function() {
    var vmInstance_;

    return {
      init: function() {
        vmInstance_ = new Vue({
          el: '#complete-screen',
          data: {
            groups: [],
            selectedsampleUIDs: [],
            selectedpatientUIDs: [],
            selectedgenes: [],
            addNewVC: false,
            selectedPatientsNum: 0,
            selectedSamplesNum: 0,
            hasfilters: false,
            isloading: true,
            redrawgroups: [],
            customfilter: {
              display_name: 'Custom',
              type: '',
              sampleUids: [],
              patientUids: []
            },
            charts: {},
            groupCount: 0,
            updateSpecialCharts: false,
            showSaveButton: true,
            showManageButton: true,
            userid: 'DEFAULT',
            stats: '',
            updateStats: false,
            clearAll: false,
            showScreenLoad: false,
            showDropDown: false,
            numOfSurvivalPlots: 0,
            showedSurvivalPlot: false,
            userMovedChart: false
          }, watch: {
            charts: function() {
              this.checkForDropDownCharts();
            },
            updateSpecialCharts: function() {
              var self_ = this;
              // TODO: need to update setting timeout
              var interval = setTimeout(function() {
                clearInterval(interval);
                var _attrs = [];
                _.each(self_.groups, function(group) {
                  _attrs = _attrs.concat(group.attributes);
                });
                self_.$broadcast('update-special-charts', self_.hasfilters);
              }, 500);
            },
            updateStats: function() {
              this.stats = iViz.stat();
            },
            redrawgroups: function(newVal) {
              if (newVal.length > 0) {
                this.$broadcast('show-loader');
                _.each(newVal, function(groupid) {
                  dc.redrawAll(groupid);
                });
                this.redrawgroups = [];
                var self_ = this;
                this.$nextTick(function() {
                  self_.updateSpecialCharts = !self_.updateSpecialCharts;
                });
              }
            },
            selectedsampleUIDs: function(newVal, oldVal) {
              if (newVal.length !== oldVal.length) {
                this.selectedSamplesNum = newVal.length;
              }
            },
            selectedpatientUIDs: function(newVal, oldVal) {
              if (newVal.length !== oldVal.length) {
                this.selectedPatientsNum = newVal.length;
              }
            },
            numOfSurvivalPlots: function(newVal) {
              if (!newVal || newVal <= 0) {
                this.showedSurvivalPlot = false;
              } else {
                this.showedSurvivalPlot = true;
              }
            }
          }, events: {
            'manage-genes': function(geneList) {
              this.updateGeneList(geneList, false);
            }, 'set-selected-cases': function(selectionType, selectedCases) {
              this.setSelectedCases(selectionType, selectedCases);
            }, 'remove-chart': function(attrId, groupId) {
              this.removeChart(attrId, groupId);
            },
            'user-moved-chart': function() {
              this.userMovedChart = true;
            }
          }, methods: {
            checkForDropDownCharts: function() {
              var showDropDown = false;
              _.each(this.charts, function(_chart) {
                if (!_chart.show) {
                  showDropDown = true;
                  return false;
                }
              });
              this.showDropDown = showDropDown;
            },
            openCases: function() {
              iViz.openCases();
            },
            downloadCaseData: function() {
              iViz.downloadCaseData();
            },
            submitForm: function() {
              iViz.submitForm();
            },
            clearAllCharts: function(includeNextTickFlag) {
              var self_ = this;
              self_.clearAll = true;
              self_.hasfilters = false;
              if (self_.customfilter.patientUids.length > 0 ||
                self_.customfilter.sampleUids.length > 0) {
                self_.customfilter.sampleUids = [];
                self_.customfilter.patientUids = [];
              }
              if (includeNextTickFlag) {
                self_.$nextTick(function() {
                  self_.selectedsampleUIDs = _.keys(iViz.getCasesMap('sample'));
                  self_.selectedpatientUIDs = _.keys(iViz.getCasesMap('patient'));
                  self_.$broadcast('update-special-charts', self_.hasfilters);
                  self_.clearAll = false;
                  _.each(this.groups, function(group) {
                    dc.redrawAll(group.id);
                  });
                });
              } else {
                self_.clearAll = false;
              }
            },
            addChart: function(attrId) {
              var self_ = this;
              var attrData = self_.charts[attrId];
              var _attrAdded = false;
              var _group = {};
              var _groupIdToPush = 0;
              self_.checkForDropDownCharts();
              _.every(self_.groups, function(group) {
                if (group.type === attrData.group_type) {
                  if (group.attributes.length < 30) {
                    attrData.group_id = group.id;
                    _groupIdToPush = group.id;
                    _attrAdded = true;
                    return false;
                  }
                  _group = group;
                  return true;
                }
                return true;
              });
              self_.showScreenLoad = true;
              self_.$nextTick(function() {
                if (_attrAdded) {
                  $.when(iViz.updateGroupNdx(attrData.group_id, attrData.attr_id)).then(function(isGroupNdxDataUpdated) {
                    attrData.addChartBy = 'user';
                    self_.groups[_groupIdToPush].attributes.push(attrData);
                    if (isGroupNdxDataUpdated) {
                      self_.$broadcast('add-chart-to-group', attrData.group_id);
                    }
                    if (attrData.view_type === 'survival') {
                      self_.numOfSurvivalPlots++;
                    }
                    self_.$nextTick(function() {
                      $('#iviz-add-chart').trigger('chosen:updated');
                      self_.showScreenLoad = false;
                    });
                  });
                } else {
                  var newgroup_ = {};
                  var groupAttrs = [];
                  // newgroup_.data = _group.data;
                  newgroup_.type = _group.type;
                  newgroup_.id = self_.groupCount;
                  attrData.group_id = newgroup_.id;
                  self_.groupCount += 1;
                  groupAttrs.push(attrData);
                  newgroup_.attributes = groupAttrs;
                  $.when(iViz.createGroupNdx(newgroup_)).then(function() {
                    self_.groups.push(newgroup_);
                    self_.$nextTick(function() {
                      $('#iviz-add-chart').trigger('chosen:updated');
                      self_.showScreenLoad = false;
                    });
                  });
                }
              });
            },
            removeChart: function(attrId) {
              var self = this;
              var attrData = self.charts[attrId];
              var attributes = self.groups[attrData.group_id].attributes;
              self.checkForDropDownCharts();
              attributes.$remove(attrData);

              self.$broadcast('remove-grid-item',
                $('#chart-' + attrId + '-div'));

              if (attrData.view_type === 'survival') {
                this.numOfSurvivalPlots--;
              }

              self.$nextTick(function() {
                $('#iviz-add-chart').trigger('chosen:updated');
              });
            },
            updateGeneList: function(geneList, reset) {
              var self_ = this;
              if (reset) {
                self_.selectedgenes = geneList;
              } else {
                _.each(geneList, function(gene) {
                  var index = self_.selectedgenes.indexOf(gene);
                  if (index === -1) {
                    self_.selectedgenes.push(gene);
                  } else {
                    self_.selectedgenes.splice(index, 1);
                  }
                });
              }
              this.$broadcast('gene-list-updated', self_.selectedgenes);
            },
            setSelectedCases: function(selectionType, selectedCases) {
              var radioVal = selectionType;
              var selectedCaseUIDs = [];
              var unmappedCaseIDs = [];

              _.each(selectedCases, function(id) {
                var caseUIDs = iViz.getCaseUID(selectionType, id);
                if (caseUIDs.length === 0) {
                  unmappedCaseIDs.push(id);
                } else {
                  selectedCaseUIDs = selectedCaseUIDs.concat(caseUIDs);
                }
              });

              if (unmappedCaseIDs.length > 0) {
                new Notification().createNotification(selectedCaseUIDs.length +
                  ' cases selected. The following ' +
                  (radioVal === 'patient' ? 'patient' : 'sample') +
                  ' ID' + (unmappedCaseIDs.length === 1 ? ' was' : 's were') +
                  ' not found in this study: ' +
                  unmappedCaseIDs.join(', '), {
                  message_type: 'danger'
                });
              } else {
                new Notification().createNotification(selectedCaseUIDs.length +
                  ' case(s) selected.', {message_type: 'info'});
              }

              $('#iviz-header-right-1').qtip('toggle');
              if (selectedCaseUIDs.length > 0) {
                this.clearAllCharts(false);
                var self_ = this;
                Vue.nextTick(function() {
                  _.each(self_.groups, function(group) {
                    if (group.type === radioVal) {
                      self_.hasfilters = true;
                      self_.customfilter.type = group.type;
                      if (radioVal === 'sample') {
                        self_.customfilter.sampleUids = selectedCaseUIDs;
                        self_.customfilter.patientUids = [];
                      } else {
                        self_.customfilter.patientUids = selectedCaseUIDs;
                        self_.customfilter.sampleUids = [];
                      }
                      self_.$broadcast('update-custom-filters');
                      return false;
                    }
                  });
                });
              }
            }
          }, ready: function() {
            this.$watch('showVCList', function() {
              if (_.isObject(iViz.session)) {
                this.virtualCohorts = iViz.session.utils.getVirtualCohorts();
              }
            });
            $('#iviz-header-left-patient-select').qtip({
              content: {text: 'View the selected patients.'},
              style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
              show: {event: 'mouseover'},
              hide: {fixed: true, delay: 100, event: 'mouseout'},
              position: {
                my: 'bottom center',
                at: 'top center',
                viewport: $(window)
              }
            });
            $('#iviz-header-left-case-download').qtip({
              content: {text: 'Download clinical data for the selected cases.'},
              style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
              show: {event: 'mouseover'},
              hide: {fixed: true, delay: 100, event: 'mouseout'},
              position: {
                my: 'bottom center',
                at: 'top center',
                viewport: $(window)
              }
            });
            $('#iviz-form').qtip({
              content: {text: 'Query the selected samples.'},
              style: {classes: 'qtip-light qtip-rounded qtip-shadow'},
              show: {event: 'mouseover'},
              hide: {fixed: true, delay: 100, event: 'mouseout'},
              position: {
                my: 'bottom center',
                at: 'top center',
                viewport: $(window)
              }
            });
          }
        });
      },
      getInstance: function() {
        if (typeof vmInstance_ === 'undefined') {
          this.init();
        }
        return vmInstance_;
      },
      setSelectedCases: function(selectionType, selectedCases) {
        vmInstance_.setSelectedCases(selectionType, selectedCases);
      },
      setGeneList: function(geneList) {
        vmInstance_.updateGeneList(geneList, true);
      },
      getGeneList: function() {
        return vmInstance_.selectedgenes;
      }
    };
  })();

  Vue.directive('select', {
    twoWay: true,
    params: ['charts'],
    paramWatchers: {
      charts: function() {
        $('#iviz-add-chart').trigger('chosen:updated');
      }
    },
    bind: function() {
      var self = this;
      $(this.el).chosen({
        width: '30%',
        search_contains: true
      })
        .change(
          function() {
            var value = self.el.value;
            self.params.charts[value].show = true;
            self.vm.addChart(this.el.value);
          }.bind(this)
        );
    }
  });

  // This is an example to add sample to a virtual cohort from scatter plot
  /*  iViz.vue.vmScatter = (function() {
   var vmInstance_;

   return {
   init: function() {
   vmInstance_ = new Vue({
   el: '#scatter-container',
   data: {
   showList: false,
   virtualCohorts: null,
   sampleID: null,
   cancerStudyID: null,
   addNewVC: false
   }, ready: function() {
   this.$watch('showList', function() {
   if (_.isObject(iViz.session)) {
   this.virtualCohorts = iViz.session.utils.getVirtualCohorts();
   }
   });
   }
   });
   },
   getInstance: function() {
   if (typeof vmInstance_ === 'undefined') {
   this.init();
   }
   return vmInstance_;
   }
   };
   })();*/
})(window.Vue, window.iViz, window.dc, window._);
