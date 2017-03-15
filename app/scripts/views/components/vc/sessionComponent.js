'use strict';
(function(Vue, $, vcSession) {
  Vue.component('sessionComponent', {
    template: '<div v-if="showManageButton || showSaveButton" class="input-group">' +
    '<span class="input-group-addon">Cohort</span>' +
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
    ' :showmodal.sync="showVCList" v-for="virtualCohort in' +
    ' virtualCohorts"> </tr> </table> </div> <div slot="footer"> </div>' +
    ' </modaltemplate>',
    props: [
      'selectedPatientsNum', 'selectedSamplesNum', 'userid', 'showSaveButton',
      'showManageButton', 'stats', 'updateStats'
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
        if (self.userid !== undefined && self.userid !== '' &&
          self.userid.length > 0 && self.userid !== 'DEFAULT') {
          $.when(vcSession.model.loadUserVirtualCohorts(self.userid))
            .then(function(_virtualCohorts) {
              self.virtualCohorts = _virtualCohorts;
            });
        } else {
          this.virtualCohorts = vcSession.utils.getVirtualCohorts();
        }
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
          hide: {fixed: true, delay: 1000, event: 'mouseleave'},
          position: {
            my: 'top center',
            at: 'bottom center',
            viewport: $(window)
          },
          events: {
            render: function(event, api) {
              $('.iviz-save-cohort-btn-qtip .save-cohort').click(function() {
                var cohortName =
                  $('.iviz-save-cohort-btn-qtip .cohort-name').val();
                var cohortDescription =
                  $('.iviz-save-cohort-btn-qtip .cohort-description').val();
                if (_.isObject(vcSession)) {
                  self_.updateStats = true;
                  self_.$nextTick(function() {
                    vcSession.events.saveCohort(self_.stats,
                      self_.selectedPatientsNum, self_.selectedSamplesNum,
                      self_.userid, cohortName, cohortDescription || '')
                      .done(function() {
                        $.notify('Added to new Virtual Study', {
                          type: 'success'
                        });
                      })
                      .fail(function() {
                        $.notify('Failed to connect to Portal service, ' +
                          'but we would be able to keep it within the browser.', {
                          type: 'warning'
                        });
                      })
                      .always(function() {
                        api.hide();
                        $('.iviz-save-cohort-btn-qtip .cohort-name').val('');
                        $('.iviz-save-cohort-btn-qtip .cohort-description').val('');
                        $('.iviz-save-cohort-btn-qtip .save-cohort')
                          .attr('disabled', true);
                      });
                  });
                }
              });
              $('.iviz-save-cohort-btn-qtip .cohort-name')
                .keyup(function() {
                  if ($('.iviz-save-cohort-btn-qtip .cohort-name').val() === '') {
                    $('.iviz-save-cohort-btn-qtip .save-cohort')
                      .attr('disabled', true);
                  } else {
                    $('.iviz-save-cohort-btn-qtip .save-cohort')
                      .attr('disabled', false);
                  }
                });
            }
          },
          content: '<div><div class="input-group">' +
          '<input type="text" class="form-control cohort-name" ' +
          'placeholder="New Cohort Name"> <span class="input-group-btn">' +
          '<button class="btn btn-default save-cohort" ' +
          'type="button" disabled>Save</button></span>' +
          '</div><div>' +
          '<textarea class="form-control cohort-description" rows="5" ' +
          'placeholder="New Cohort Description (Optional)"></textarea>' +
          '</div></div>'
        });
      }
    }
  });
})(window.Vue,
  window.$ || window.jQuery, window.vcSession);
