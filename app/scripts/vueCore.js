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
  iViz.session = {};

  iViz.session.manage = (function() {
    var vmInstance_;

    return {
      init: function() {
        vmInstance_ = new Vue({
          el: '#complete-screen',
          data: {
            groups: [],
            selectedsamples: [],
            selectedpatients: [],
            patientmap: [],
            samplemap: [],
            selectedgenes: [],
            showVCList: false,
            addNewVC: false,
            selectedPatientsNum: 0,
            selectedSamplesNum: 0,
            hasfilters: false,
            virtualCohorts: [],
            isloading: true,
            redrawgroups:[]
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
                this.$broadcast('selected-sample-update', newVal);
                this.selectedSamplesNum = newVal.length;
              }
            },
            'selectedpatients': function(newVal,oldVal) {
              if(newVal.length!==oldVal.length){
                this.$broadcast('survival-update', newVal);
                this.selectedPatientsNum = newVal.length;
              }
            }
          }, events: {
            'redraw-all-charts':function(){
              this.redrawgroups.push(true);
            },'manage-genes':function(geneList){
              this.updateGeneList(geneList,false);
            }
          },methods: {
            initialize: function() {
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
            },
            clearAll: function(){
              this.$broadcast('clear-all-filters');
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
              console.log(self_.selectedgenes);
              this.$broadcast('gene-list-updated',self_.selectedgenes);
            },
            setSamplesSelectedCases: function(selectedCases){
              var self_ = this;
              _.map(self_.groups,function(group){
                if(group.type==='sample'){
                  _.map(group.attributes,function(attribute){
                    if(attribute.attr_id === 'sample_id'){
                      attribute.filter = _.unique(selectedCases);
                    }
                  });
                }
              });
            },
            setSamplesChartVisibility: function(){
              var self_ = this;
              _.map(self_.groups,function(group){
                if(group.type==='sample'){
                  _.map(group.attributes,function(attribute){
                    if((attribute.attr_id === 'sample_id') && !attribute.show){
                      attribute.show = true;
                    }
                  });
                }
              });
            },
            setPatientsSelectedCases: function(selectedCases){
              var self_ = this;
              _.map(self_.groups,function(group){
                if(group.type==='patient'){
                  _.map(group.attributes,function(attribute){
                    if(attribute.attr_id === 'patient_id'){
                      attribute.filter = _.unique(selectedCases);
                    }
                  });
                }
              });
            },
            setPatientsChartVisibility: function(){
              var self_ = this;
              _.map(self_.groups,function(group){
                if(group.type==='patient'){
                  _.map(group.attributes,function(attribute){
                    if((attribute.attr_id === 'patient_id') && !attribute.show){
                      attribute.show = true;
                    }
                  });
                }
              });
            }
          }, ready: function() {
            this.$watch('showVCList', function() {
              this.virtualCohorts = iViz.session.utils.getVirtualCohorts();
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
      setSelectedSamples : function(selectedCases){
        vmInstance_.setSamplesChartVisibility();
        Vue.nextTick(function () {
          vmInstance_.setSamplesSelectedCases(selectedCases)
        })
      },
      setSelectedPatients : function(selectedCases){
        vmInstance_.setPatientsChartVisibility();
        Vue.nextTick(function () {
          vmInstance_.setPatientsSelectedCases(selectedCases)
        })
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
    params: ['groups'],
    bind: function() {
      var self = this;
      $(this.el).chosen({
          width: '30%'
        })
        .change(function() {
            if (this.value !== '') {
              var value = this.el.value.split('---');
              self.params.groups[value[0]].attributes[value[1]].show = true
            }
          }.bind(this)
        );
    }
  });

  // This is an example to add sample to a virtual cohort from scatter plot
  iViz.session.vmScatter = (function() {
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
              this.virtualCohorts = iViz.session.utils.getVirtualCohorts();
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
