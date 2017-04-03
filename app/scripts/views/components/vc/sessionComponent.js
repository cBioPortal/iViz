'use strict';
(function(Vue, $, vcSession) {
  Vue.component('sessionComponent', {
    template: '<div v-if="showManageButton || showSaveButton" ' +
    'class="input-group"><span class="input-group-addon">Cohort</span>' +
    '<div class="input-group-btn">' +
    '<button v-if="showSaveButton" type="button" ' +
    'class="btn btn-default save-cohort-btn">' +
    '<i class="fa fa-bookmark" alt="Save Cohort"></i></button>' +
    '<button v-if="showManageButton" type="button" @click="manageCohorts()" ' +
    'class="btn btn-default manage-cohort-btn">' +
    '<i class="fa fa-bars" alt="Manage Cohort"></i></button>' +
    '</div></div>' +
    ' <modaltemplate :show.sync="showVCList" size="modal-xlg"> <div' +
    ' slot="header"> <h4 class="modal-title">Virtual Cohorts</h4> </div>' +
    ' <div slot="body"> <table class="table table-bordered table-hover' +
    ' table-condensed"> <thead> <tr style="font-weight: bold"> <td' +
    ' style="width:20%">Name</td> <td style="width:40%">Description</td>' +
    ' <td style="width:10%">Patients</td> <td' +
    ' style="width:10%">Samples</td> <td' +
    ' style="width:20%">Operations</td> </tr> </thead> <tr' +
    ' is="editable-row" :data="virtualCohort"' +
    ' :showmodal.sync="showVCList" :show-share-button="showShareButton" v-for="virtualCohort in' +
    ' virtualCohorts"> </tr> </table> </div> <div slot="footer"> </div>' +
    ' </modaltemplate>',
    props: [
      'loadUserSpecificCohorts', 'selectedPatientsNum', 'selectedSamplesNum', 'userid', 'showSaveButton',
      'showManageButton', 'stats', 'updateStats', 'showShareButton'
    ],
    data: function() {
      return {
        showVCList: false,
        virtualCohorts: []
      };
    }, events: {
      'remove-cohort': function(cohort) {
        this.virtualCohorts.$remove(cohort);
      }
    }, methods: {
      manageCohorts: function() {
        var self = this;
        self.showVCList = true;
        if (self.loadUserSpecificCohorts) {
          $.when(vcSession.model.loadUserVirtualCohorts()).then(function(_virtualCohorts) {
            self.virtualCohorts = _virtualCohorts;
          });
        } else {
          this.virtualCohorts = vcSession.utils.getVirtualCohorts();
        }
      },
      saveCohort: function() {
        var _self = this;
        _self.updateStats = true;
        _self.$nextTick(function() {
          _self.addNewVC = true;
        });
      }
    }, ready: function() {
      var self_ = this;
      if (this.showSaveButton) {
        $('.save-cohort-btn .fa-bookmark').qtip({
          style: {
            classes: 'qtip-light qtip-rounded qtip-shadow'
          },
          show: {event: 'mouseover', ready: false},
          hide: {fixed: true, delay: 200, event: 'mouseleave'},
          position: {
            my: 'bottom center',
            at: 'top center',
            viewport: $(window)
          },
          content: 'Save Cohort'
        });
        $('.manage-cohort-btn').qtip({
          style: {
            classes: 'qtip-light qtip-rounded qtip-shadow'
          },
          show: {event: 'mouseover', ready: false},
          hide: {fixed: true, delay: 200, event: 'mouseleave'},
          position: {
            my: 'bottom center',
            at: 'top center',
            viewport: $(window)
          },
          content: 'Manage Cohort'
        });
        $('.save-cohort-btn').qtip({
          style: {
            classes: 'qtip-light qtip-rounded qtip-shadow ' +
            'iviz-save-cohort-btn-qtip'
          },
          show: {event: 'click', ready: false},
          hide: false,
          position: {
            my: 'top center',
            at: 'bottom center',
            viewport: $(window)
          },
          events: {
            render: function(event, api) {
              var tooltip = $('.iviz-save-cohort-btn-qtip .qtip-content');
              tooltip.find('.save-cohort').click(function() {
                tooltip.find('.saving').css('display', 'block');
                tooltip.find('.close-dialog').css('display', 'none');
                tooltip.find('.saved').css('display', 'none');
                tooltip.find('.dialog').css('display', 'none');
                api.reposition();

                var cohortName = tooltip.find('.cohort-name').val();
                var cohortDescription =
                  tooltip.find('.cohort-description').val();
                if (_.isObject(vcSession)) {
                  self_.updateStats = true;
                  self_.$nextTick(function() {
                    var _selectedSamplesNum = 0;
                    var _selectedPatientsNum = 0;
                    if (_.isObject(self_.stats.selectedCases)) {
                      _.each(self_.stats.selectedCases, function(studyCasesMap) {
                        _selectedSamplesNum += studyCasesMap.samples.length;
                        _selectedPatientsNum += studyCasesMap.patients.length;
                      });
                      self_.selectedSamplesNum = _selectedSamplesNum;
                      self_.selectedPatientsNum = _selectedPatientsNum;
                    }
                    
                    vcSession.events.saveCohort(self_.stats,
                      cohortName, cohortDescription || '')
                      .done(function() {
                        tooltip.find('.savedMessage').text(
                          'Added to new Virtual Cohort');
                      })
                      .fail(function() {
                        tooltip.find('.savedMessage').html(
                          '<i class="fa fa-exclamation-triangle"></i>' +
                          'Failed to save virtual cohort, ' +
                          'please try again later.');
                      })
                      .always(function() {
                        tooltip.find('.close-dialog')
                          .css('display', 'inline-block');
                        tooltip.find('.saved').css('display', 'block');
                        tooltip.find('.saving').css('display', 'none');
                        tooltip.find('.dialog').css('display', 'none');
                        tooltip.find('.cohort-name').val('');
                        tooltip.find('.cohort-description').val('');
                        tooltip.find('.save-cohort')
                          .attr('disabled', true);
                        api.reposition();
                      });
                  });
                }
              });
              tooltip.find('.close-dialog i').click(function() {
                api.hide();
              });
              tooltip.find('.cohort-name')
                .keyup(function() {
                  if (tooltip.find('.cohort-name').val() === '') {
                    tooltip.find('.save-cohort')
                      .attr('disabled', true);
                  } else {
                    tooltip.find('.save-cohort')
                      .attr('disabled', false);
                  }
                });
            },
            show: function() {
              var tooltip = $('.iviz-save-cohort-btn-qtip .qtip-content');
              tooltip.find('.close-dialog').css('display', 'inline-block');
              tooltip.find('.dialog').css('display', 'block');
              tooltip.find('.saving').css('display', 'none');
              tooltip.find('.saved').css('display', 'none');
            }
          },
          content: '<div><div class="close-dialog">' +
          '<i class="fa fa-times-circle-o"></i></div>' +
          '<div class="dialog"><div class="input-group">' +
          '<input type="text" class="form-control cohort-name" ' +
          'placeholder="New Cohort Name"> <span class="input-group-btn">' +
          '<button class="btn btn-default save-cohort" ' +
          'type="button" disabled>Save</button></span>' +
          '</div><div>' +
          '<textarea class="form-control cohort-description" rows="5" ' +
          'placeholder="New Cohort Description (Optional)"></textarea>' +
          '</div></div>' +
          '<div class="saving" style="display: none;">' +
          '<i class="fa fa-spinner fa-spin"></i> Saving virtual cohort</div>' +
          '<div class="saved" style="display: none;">' +
          '<span class="savedMessage"></span>' +
          '<button class="btn btn-default btn-sm query"' +
          '>Query Virtual Cohort</button></div>' +
          '</div>'
        });
      }
    }
  });
})(window.Vue,
  window.$ || window.jQuery, window.vcSession);
