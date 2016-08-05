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
 * Created by Karthik Kalletla on 3/16/16.
 */

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
            selectedsamples: [],
            selectedpatients: [],
           // patientmap: [],
           // samplemap: [],
            selectedgenes: [],
            showVCList: false,
            addNewVC: false,
            selectedPatientsNum: 0,
            selectedSamplesNum: 0,
            hasfilters: false,
            virtualCohorts: [],
            isloading: true,
            redrawgroups:[],
            customfilter:{
              display_name:"Custom",
              type:"",
              sampleIds:[],
              patientIds:[]
            },
            initializedSampleSpecialCharts:true,
            initializedPatientSpecialCharts:true,
            charts: {},
            groupCount:0
          }, watch: {
            'redrawgroups':function(newVal,oldVal){
              if(newVal.length>0){
                _.each(this.groups, function(group){
                  dc.redrawAll(group.id);
                });
                this.redrawgroups = [];
              }
            },
            'selectedsamples': function(newVal,oldVal) {
              if(newVal.length!==oldVal.length){
                if(!this.initializedSampleSpecialCharts) {
                  this.$broadcast('selected-sample-update', newVal);
                }else{
                  this.initializedSampleSpecialCharts = false;
                }
                this.selectedSamplesNum = newVal.length;
              }
            },
            'selectedpatients': function(newVal,oldVal) {
              if(newVal.length!==oldVal.length){
                if(!this.initializedPatientSpecialCharts) {
                  this.$broadcast('survival-update', newVal);
                }else{
                  this.initializedPatientSpecialCharts = false;
                }
                this.selectedPatientsNum = newVal.length;
              }
            }
          }, events: {
            'redraw-all-charts':function(){
              this.redrawgroups.push(true);
            },'manage-genes':function(geneList){
              this.updateGeneList(geneList,false);
            },'set-selected-cases' : function(selectionType, selectedCases){
              this.setSelectedCases(selectionType, selectedCases);
            },'remove-chart':function(attrId,groupId){
              this.removeChart(attrId,groupId)
            }, 'select-chart':function(){
                var a = 5;
                console.log(a);
            }
          },methods: {
            /*initialize: function() {
             this.groups = [];
             this.selectedsamples = [];
             this.selectedpatients = [];
             this.selectedgenes = [];
             this.patientmap = [];
             this.samplemap = [];
             this.showVCList = false;
             this.addNewVC = false;
             this.selectedPatientsNum = 0;
             this.selectedSamplesNum = 0;
             this.hasfilters = false;
             this.virtualCohorts = [];
             this.isloading = true;
             this.customfilter ={
             display_name:"Custom",
             type:"",
             sampleIds:[],
             patientIds:[]
             };
             this.charts = {};
             },*/
            clearAll: function(){
              if(this.customfilter.patientIds.length>0||this.customfilter.sampleIds.length>0){
                this.customfilter.sampleIds = [];
                this.customfilter.patientIds = [];
                this.$broadcast('update-all-filters');
              }
              this.$broadcast('clear-all-filters');
            },
            addChart: function(attrId){
             var self_ = this;
              var attrData = self_.charts[attrId];
              var _attrAdded = false;
              var _group = {};
              _.each(self_.groups,function(group){
                if(group.type === attrData.group_type){
                  if(group.attributes.length<31){
                    attrData.group_id = group.id;
                    group.attributes.push(attrData);
                    _attrAdded = true;
                    return false;
                  }else{
                    _group = group;
                  }
                }
              });
              if(!_attrAdded){
                var newgroup_ = {};
                var groupAttrs = [];
                groupAttrs.push(attrData);
                // newgroup_.data = _group.data;
                newgroup_.type = _group.type;
                newgroup_.id = self_.groupCount;
                self_.groupCount = self_.groupCount+1;
                newgroup_.attributes = groupAttrs;
                self_.groups.push(newgroup_);
              }

            },
            removeChart: function(attrId){
              var self = this;
              var attrData = self.charts[attrId];
              var attributes = self.groups[attrData.group_id].attributes;
              attributes.$remove(attrData);

              self.$nextTick(function () {
                self.$broadcast('update-grid',true);
                $("#study-view-add-chart").trigger("chosen:updated");
              })
            },
            updateGeneList : function(geneList,reset){
              var self_ = this;
              if(reset){
                self_.selectedgenes = geneList;
              }else{
                _.each(geneList,function(gene){
                  var index = self_.selectedgenes.indexOf(gene);
                  if(index === -1) {
                    self_.selectedgenes.push(gene);
                  }
                  else{
                    self_.selectedgenes.splice(index, 1);
                  }
                });
              }
              this.$broadcast('gene-list-updated',self_.selectedgenes);
            },
            setSelectedCases : function(selectionType, selectedCases){
              var radioVal = selectionType;
              var selectedCaseIds = [];
              var unmappedCaseIds = [];

              if (radioVal === 'patient') {
                var patientIdsList = Object.keys(iViz.getCasesMap('patient'));
                _.each(selectedCases, function (id) {
                  if(patientIdsList.indexOf(id) !== -1){
                    selectedCaseIds.push(id);
                  }else{
                    unmappedCaseIds.push(id)
                  }
                });
              } else {
                var sampleIdsList = Object.keys(iViz.getCasesMap('sample'));
                _.each(selectedCases, function (id) {
                  if(sampleIdsList.indexOf(id) !== -1){
                    selectedCaseIds.push(id);
                  }else{
                    unmappedCaseIds.push(id)
                  }
                });
              }

              if (unmappedCaseIds.length > 0) {
                new Notification().createNotification(selectedCaseIds.length +
                  ' cases selected. The following ' + (radioVal === 'patient' ? 'patient' : 'sample') +
                  ' ID' + (unmappedCaseIds.length === 1 ? ' was' : 's were') + ' not found in this study: ' +
                  unmappedCaseIds.join(', '), {message_type: 'warning'});
              } else {
                new Notification().createNotification(selectedCaseIds.length + ' case(s) selected.', {message_type: 'info'});
              }

              $('#study-view-header-right-1').qtip('toggle');
              if(selectedCaseIds.length > 0) {
                this.clearAll();
                var self_ = this;
                Vue.nextTick(function () {

                  $.each(self_.groups,function(key,group){
                    if(group.type === radioVal){
                      self_.hasfilters = true;
                      self_.customfilter.type = group.type;
                      if(radioVal ==='sample'){
                        self_.customfilter.sampleIds = selectedCaseIds;
                        self_.customfilter.patientIds = [];
                      }else{
                        self_.customfilter.patientIds = selectedCaseIds;
                        self_.customfilter.sampleIds = [];
                      }
                      self_.$broadcast('update-custom-filters');
                      return false;
                    }
                  });
                })
              }

            }
          }, ready: function() {
            this.$watch('showVCList', function() {
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
      },
      setSelectedCases : function(selectionType, selectedCases){
        vmInstance_.setSelectedCases(selectionType, selectedCases);
      },
      setGeneList : function(geneList){
        vmInstance_.updateGeneList(geneList,true)
      },
      getGeneList : function(){
        return vmInstance_.selectedgenes;
      }
    };
  })();


  Vue.directive('select', {
    twoWay: true,
    params: ['charts'],
    paramWatchers: {
      charts: function (val, oldVal) {
        $("#study-view-add-chart").trigger("chosen:updated");
      }
    },
    bind: function() {

      $(this.el).chosen({
          width: '30%'
        })
        .change(function() {
            var self=this;
            var value = this.el.value;
            self.params.charts[value].show = true;
            self.vm.$nextTick(function () {
                $("#study-view-attributes-panel").show();   //put this in ready function in attributes panel
            });
            
            $(".panel-button").unbind("click"); //need the unbind to prevent 
                                                //click from registering multiple times
            $(".panel-button").click(function(){
                //var clickedChart = $(this).attr("id"); 
                self.vm.addChart(value);
                $("#study-view-attributes-panel").hide();
                $("#study-view-add-chart").trigger("chosen:updated"); //put this in attributes panel in click event
            }); 
          }
                  
            .bind(this)
        );
    }
  });

  // This is an example to add sample to a virtual cohort from scatter plot
  iViz.vue.vmScatter = (function() {
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
  })();
})(window.Vue, window.iViz, window.dc,window._);
