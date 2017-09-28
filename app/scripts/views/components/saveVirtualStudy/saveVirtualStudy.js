'use strict';
(function(Vue, $, vcSession, iViz) {
  Vue.component('saveVirtualStudy', {
    template: 
    '<div v-if="showSaveButton" class="save-virtual-study">' +
    '<div class="save-cohort-btn">' +
    '<i class="fa fa-floppy-o" alt="Save Virtual Study"></i></div></div>',
    props: {
      selectedPatientsNum: {
        type: Number,
        default: 0
      },
      selectedSamplesNum: {
        type: Number,
        default: 0
      },
      stats: {
        type: Object
      },
      updateStats: {
        type: Boolean,
        default: false
      },
      showSaveButton: {
        type: Boolean,
        default: false
      },
      createdQtip: {
        type: Boolean,
        default: false
      }
    },
    data: function() {
      return {
        savedVC: null
      };
    },
    watch: {
      'showSaveButton': function(showSaveButton) {
        // In case static qtip will be created multiple times.
        if (showSaveButton && !this.createdQtip) {
          this.createQtip();
        }
      }
    }, 
    methods: {
      saveCohort: function() {
        var _self = this;
        _self.updateStats = true;
        _self.$nextTick(function() {
          _self.addNewVC = true;
        });
      },
      createQtip: function() {
        var self_ = this;
        $('.save-virtual-study').qtip(iViz.util.defaultQtipConfig('Save Virtual Study'));
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
                        tooltip.find('.savedMessage').html(
                          '<span>Virtual study <i>' + cohortName +
                          '</i> is saved.</span>' +
                          '<a class="left-space" href="' +
                          window.cbioURL + 'study?id=' +
                          self_.savedVC.id + '">view</a>');
                      })
                      .fail(function() {
                        tooltip.find('.savedMessage').html(
                          '<i class="fa fa-exclamation-triangle"></i>' +
                          '<span class="left-space">' +
                          'Failed to save virtual study, ' +
                          'please try again later.</span>');
                      })
                      .always(function() {
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
              tooltip.find('.dialog').css('display', 'block');
              tooltip.find('.saving').css('display', 'none');
              tooltip.find('.saved').css('display', 'none');

              // Tell the tip itself to not bubble up clicks on it
              $($(this).qtip('api').elements.tooltip).click(function() { return false; });

              // Tell the document itself when clicked to hide the tip and then unbind
              // the click event (the .one() method does the auto-unbinding after one time)
              $(document).one("click", function() { $(".save-cohort-btn").qtip('hide'); });
            }
          },
          content: '<div><div class="dialog"><div class="input-group">' +
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
          '</div></div>'
        });
      }
    }
  });
})(window.Vue,
  window.$ || window.jQuery, window.vcSession, window.iViz);