'use strict';
(function(Vue, $, vcSession) {
  Vue.component('saveVirtualStudy', {
    template: 
    '<div v-if="showSaveButton" class="save-virtual-study">' +
    '<div class="save-cohort-btn">' +
    '<i class="fa fa-floppy-o" alt="Save Virtual Study"></i></div></div>',
    props: [
      'selectedPatientsNum', 'selectedSamplesNum',
      'stats', 'updateStats', 'showSaveButton'
    ],
    data: function() {
      return {
        savedVC: null
      };
    }, methods: {
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
        $('.save-virtual-study').qtip({
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
          content: 'Save Virtual Study'
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
                      .done(function(response) {
                        self_.savedVC = response;
                        tooltip.find('.savedMessage').text(
                          'Added virtual study ' + cohortName);
                      })
                      .fail(function() {
                        tooltip.find('.savedMessage').html(
                          '<i class="fa fa-exclamation-triangle"></i>' +
                          'Failed to save virtual study, ' +
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
              tooltip.find('.query').click(function() {
                if(_.isObject(self_.savedVC) && self_.savedVC.id) {
                  window.open(window.cbioURL + 'study?cohorts=' + self_.savedVC.id);
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
              self_.updateStats = true;
              self_.$nextTick(function() {
                // If user hasn't specific description only.
                if (!tooltip.find('.cohort-description').val()) {
                  $.when(vcSession.utils.generateCohortDescription(self_.stats.selectedCases))
                    .then(function(_desp) {
                      // If user hasn't specific description only.
                      if (!tooltip.find('.cohort-description').val()) {
                        tooltip.find('.cohort-description').val(_desp);
                      }
                    });
                }
              });
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
          'placeholder="Virtual study Name"> <span class="input-group-btn">' +
          '<button class="btn btn-default save-cohort" ' +
          'type="button" disabled>Save</button></span>' +
          '</div><div>' +
          '<textarea class="form-control cohort-description" rows="5" ' +
          'placeholder="Virtual study description (Optional)"></textarea>' +
          '</div></div>' +
          '<div class="saving" style="display: none;">' +
          '<i class="fa fa-spinner fa-spin"></i> Saving virtual study</div>' +
          '<div class="saved" style="display: none;">' +
          '<span class="savedMessage"></span>' +
          '<button class="btn btn-default btn-sm query"' +
          '>View this virtual study</button></div>' +
          '</div>'
        });
      }
    }
  });
})(window.Vue,
  window.$ || window.jQuery, window.vcSession);