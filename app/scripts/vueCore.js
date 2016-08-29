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
            selectedgenes: [],
            addNewVC: false,
            selectedPatientsNum: 0,
            selectedSamplesNum: 0,
            hasfilters: false,
            isloading: true,
            redrawgroups:[],
            customfilter:{
              display_name:"Custom",
              type:"",
              sampleIds:[],
              patientIds:[]
            },
            charts: {},
            groupCount:0,
            updateSpecialCharts:false,
            showSaveButton:true,
            showManageButton:true,
            userid:'DEFAULT',
            stats:'',
            updateStats:false,
            highlightAllButtons:false,
            highlightCaseButtons:false,
            clearGroupFlag:false
          }, watch: {
            'updateSpecialCharts':function(newVla,oldVal) {
              var self_ = this;
              //TODO: need to update setting timeout
              var interval = setTimeout(function () {
                clearInterval(interval);
                self_.$broadcast('update-special-charts');
              }, 500);
            },
            'updateStats':function(newVal){
              this.stats = iViz.stat();
            },
            'redrawgroups':function(newVal,oldVal){
              if(newVal.length>0){
                this.$broadcast('show-loader');
                _.each(newVal, function(groupid){
                  dc.redrawAll(groupid);
                });
                this.redrawgroups = [];
                var self_ =this;
                 this.$nextTick(function(){
                   self_.updateSpecialCharts = !self_.updateSpecialCharts;
                 });
                
              }
            },
            'selectedsamples': function(newVal,oldVal) {
              if(newVal.length!==oldVal.length){
                this.selectedSamplesNum = newVal.length;
              }
            },
            'selectedpatients': function(newVal,oldVal) {
              if(newVal.length!==oldVal.length){
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
            }
          },methods: {
            openCases:function(){
              iViz.openCases();
            },
            downloadCaseData:function(){
              iViz.downloadCaseData();
            },
            submitForm:function(){
              iViz.submitForm();
            },
            clearAll: function(){
              var self_ = this;
              self_.clearGroupFlag = true;
              this.hasfilters = false;
              if(this.customfilter.patientIds.length>0||this.customfilter.sampleIds.length>0){
                this.customfilter.sampleIds = [];
                this.customfilter.patientIds = [];
              }
              self_.$broadcast('show-loader');
              self_.$nextTick(function () {
                _.each(self_.groups,function(group){
                  dc.filterAll(group.id);
                  dc.redrawAll(group.id);
                  iViz.deleteGroupFilteredCases(group.id);
                });
                self_.selectedsamples =  _.keys(iViz.getCasesMap('sample'));
                self_.selectedpatients = _.keys(iViz.getCasesMap('patient'));
                self_.$broadcast('update-special-charts');
                self_.clearGroupFlag = false;
              });
             /* if(this.customfilter.patientIds.length>0||this.customfilter.sampleIds.length>0){
                this.customfilter.sampleIds = [];
                this.customfilter.patientIds = [];
                this.$broadcast('update-all-filters');
              }
              this.$broadcast('clear-all-groups');
             
              self_.$nextTick(function () {
                self_.selectedsamples =  _.keys(iViz.getCasesMap('sample'));
                self_.selectedpatients = _.keys(iViz.getCasesMap('patient'));
                self_.$broadcast('update-special-charts');
                _.each(this.groups,function(group){
                  dc.redrawAll(group.id);
                });
              });*/
            },
            addChart: function(attrId){
              var self_ = this;
              var attrData = self_.charts[attrId];
              var _attrAdded = false;
              var _group = {};
              var _groupIdToPush = 0;
              _.every(self_.groups,function(group){
                if(group.type === attrData.group_type){
                  if(group.attributes.length<31){
                    attrData.group_id = group.id;
                    _groupIdToPush = group.id;
                    _attrAdded = true;
                    return false;
                  }else{
                    _group = group;
                    return true;
                  }
                }else{
                  return true;
                }
              });
              if(!_attrAdded){
                var newgroup_ = {};
                var groupAttrs = [];
                // newgroup_.data = _group.data;
                newgroup_.type = _group.type;
                newgroup_.id = self_.groupCount;
                attrData.group_id = newgroup_.id;
                self_.groupCount = self_.groupCount+1;
                groupAttrs.push(attrData);
                newgroup_.attributes = groupAttrs;
                $.when(iViz.createGroupNdx(newgroup_)).then(function(){
                  self_.groups.push(newgroup_);
                  self_.$nextTick(function () {
                    $("#iviz-add-chart").trigger("chosen:updated");
                  });
                });
              }else{
                $.when(iViz.updateGroupNdx(attrData.group_id,attrData.attr_id)).then(function(){
                  self_.groups[_groupIdToPush].attributes.push(attrData);
                  self_.$broadcast('add-chart-to-group',attrData.group_id,attrData.attr_id);
                  self_.$nextTick(function () {
                    $("#iviz-add-chart").trigger("chosen:updated");
                  });
                });
                
              }

              
            },
            removeChart: function(attrId){
              var self = this;
              var attrData = self.charts[attrId];
              var attributes = self.groups[attrData.group_id].attributes;
              attributes.$remove(attrData);

              self.$broadcast('remove-grid-item',$('#chart-'+attrId+'-div'));
              self.$nextTick(function () {
                $("#iviz-add-chart").trigger("chosen:updated");
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

              $('#iviz-header-right-1').qtip('toggle');
              if(selectedCaseIds.length > 0) {
                this.clearAll();
                var self_ = this;
                Vue.nextTick(function () {

                  _.each(self_.groups,function(group){
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
            $('.iviz-header-left-5').qtip({
              content: {text: 'Click to view the selected cases' },
              style: { classes: 'qtip-light qtip-rounded qtip-shadow' },
              show: {event: 'mouseover'},
              hide: {fixed:true, delay: 100, event: 'mouseout'},
              position: {my:'bottom center', at:'top center', viewport: $(window)}
            });
            $('#iviz-header-left-6').qtip({
              content: {text: 'Click to download the selected cases' },
              style: { classes: 'qtip-light qtip-rounded qtip-shadow' },
              show: {event: 'mouseover'},
              hide: {fixed:true, delay: 100, event: 'mouseout'},
              position: {my:'bottom center', at:'top center', viewport: $(window)}
            })
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
        $("#iviz-add-chart").trigger("chosen:updated");
      }
    },
    bind: function() {
      var self = this;
      $(this.el).chosen({
          width: '30%'
        })
        .change(function() {
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
})(window.Vue, window.iViz, window.dc,window._);
