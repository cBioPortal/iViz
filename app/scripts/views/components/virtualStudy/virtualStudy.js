'use strict';
(function(Vue, $, vcSession, iViz) {
  Vue.component('virtualStudy', {
    template:
    '<div class="virtual-study">' +
    '<div class="virtual-study-btn">' +
    'Virtual Study</div></div>',
    props: {
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
      showShareButton: {
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
        savedVS: null,
        virtualStudyName: 'Selected Study',
        virtualStudyDescription: ''
      };
    },
    methods: {
      styleDisplay: function(el, action) {
        el.css('display', action);
      },
      showDialog: function(tooltip) {
        this.styleDisplay(tooltip.find('.dialog'), 'block');
      },
      hideDialog: function(tooltip) {
        this.styleDisplay(tooltip.find('.dialog'), 'none');
      },
      showLoading: function(tooltip) {
        this.styleDisplay(tooltip.find('.saving'), 'block');
      },
      hideLoading: function(tooltip) {
        this.styleDisplay(tooltip.find('.saving'), 'none');
      },
      showShared: function(tooltip) {
        this.styleDisplay(tooltip.find('.shared'), 'block');
      },
      hideShared: function(tooltip) {
        this.styleDisplay(tooltip.find('.shared'), 'none');
      },
      showSaved: function(tooltip) {
        this.styleDisplay(tooltip.find('.saved'), 'block');
      },
      hideSaved: function(tooltip) {
        this.styleDisplay(tooltip.find('.saved'), 'none');
      },
      showFailedInfo: function(tooltip) {
        this.styleDisplay(tooltip.find('.failed'), 'block');
      },
      hideFailedInfo: function(tooltip) {
        this.styleDisplay(tooltip.find('.failed'), 'none');
      },
      showAfterClipboard: function(tooltip) {
        this.styleDisplay(tooltip.find('.after-clipboard'), 'block');
      },
      hideAfterClipboard: function(tooltip) {
        this.styleDisplay(tooltip.find('.after-clipboard'), 'none');
      },
      updateFailedMessage: function(tooltip, message) {
        tooltip.find('.failed .message')
          .html(message)
      },
      updateSavedMessage: function(tooltip, message) {
        tooltip.find('.saved .message')
          .html(message)
      },
      updateSavingMessage: function(tooltip, message) {
        tooltip.find('.saving .message')
          .html(message)
      },
      disableBtn: function(el, action) {
        el.attr('disabled', action);
      },
      disableSaveCohortBtn: function(tooltip) {
        this.disableBtn(tooltip.find('.save-cohort'), true);
      },
      enableSaveCohortBtn: function(tooltip) {
        this.disableBtn(tooltip.find('.save-cohort'), false);
      },
      disableShareCohortBtn: function(tooltip) {
        this.disableBtn(tooltip.find('.share-cohort'), true);
      },
      enableShareCohortBtn: function(tooltip) {
        this.disableBtn(tooltip.find('.share-cohort'), false);
      },
      saveCohort: function() {
        var _self = this;
        _self.updateStats = true;
        _self.$nextTick(function() {
          _self.addNewVC = true;
        });
      },
      checkVSName: function(tooltip) {
        if (tooltip.find('.cohort-name').val() === '') {
          this.disableSaveCohortBtn(tooltip);
          this.disableSaveCohortBtn(tooltip);
        } else {
          this.enableSaveCohortBtn(tooltip);
          this.enableShareCohortBtn(tooltip);
        }
      },
      createQtip: function() {
        var self_ = this;
        var previousSelectedCases = {};
        $('.virtual-study').qtip(iViz.util.defaultQtipConfig('Save/Share Virtual Study'));
        $('.virtual-study-btn').qtip({
          style: {
            classes: 'qtip-light qtip-rounded qtip-shadow ' +
            'iviz-virtual-study-btn-qtip'
          },
          show: false,
          hide: false,
          position: {
            my: 'top center',
            at: 'bottom center',
            viewport: $(window)
          },
          events: {
            render: function(event, api) {
              var tooltip = $('.iviz-virtual-study-btn-qtip .qtip-content');
              tooltip.find('.save-cohort').click(function() {
                self_.hideDialog(tooltip);
                self_.showLoading(tooltip);
                self_.updateSavingMessage(tooltip, 'Saving virtual study...');
                self_.hideSaved(tooltip)

                api.reposition();

                var cohortName = tooltip.find('.cohort-name').val();
                var cohortDescription =
                  tooltip.find('textarea').val();
                if (_.isObject(vcSession)) {
                  self_.updateStats = true;
                  self_.$nextTick(function() {
                    var _selectedSamplesNum = 0;
                    if (_.isObject(self_.stats.studies)) {
                      _.each(self_.stats.studies, function(studyCasesMap) {
                        _selectedSamplesNum += studyCasesMap.samples.length;
                      });
                      self_.selectedSamplesNum = _selectedSamplesNum;
                    }

                    vcSession.events.saveCohort(self_.stats,
                      cohortName, cohortDescription || '', true)
                      .done(function(response) {
                        self_.savedVS = response;
                        self_.updateSavedMessage(tooltip, '<span>Virtual study <i>' + cohortName +
                          '</i> is saved.</span>' +
                          '<a class="left-space" href="' +
                          window.cbioURL + 'study?id=' +
                          self_.savedVS.id + '">view</a>');
                        tooltip.find('.saved .message').find('a').click(function(event) {
                          event.preventDefault();
                          window.open(window.cbioURL + 'study?id=' +
                            self_.savedVS.id);
                        });
                      })
                      .fail(function() {
                        self_.hideSaved(tooltip);
                        self_.updateFailedMessage(tooltip,
                          '<i class="fa fa-exclamation-triangle"></i>' +
                          '<span class="left-space">' +
                          'Failed to save virtual study, ' +
                          'please try again later.</span>');
                        self_.showFailedInfo(tooltip);
                      })
                      .always(function() {
                        self_.showSaved(tooltip);
                        self_.hideLoading(tooltip);
                        self_.hideDialog(tooltip);

                        tooltip.find('.cohort-name').val('');
                        tooltip.find('textarea').val('');
                        self_.virtualStudyDescription = '';

                        self_.disableSaveCohortBtn(tooltip);
                        api.reposition();
                      });
                  });
                }
              });
              tooltip.find('.share-cohort').click(function() {
                self_.hideDialog(tooltip);
                self_.hideShared(tooltip);
                self_.showLoading(tooltip);
                self_.updateSavingMessage(tooltip, 'Generating the virtual study link');

                var cohortName = tooltip.find('.cohort-name').val();
                var cohortDescription =
                  tooltip.find('textarea').val();
                if (_.isObject(vcSession)) {
                  self_.updateStats = true;

                  self_.$nextTick(function() {
                    if (_.isObject(self_.stats.studies)) {
                      // When a user clicks copy, it will trigger saving the current virtual cohort and return the url 
                      // to the user. When a user want to see the cohort url, he/she needs to click Share button. 
                      // We always show the url to user but we don't need to same virtual cohort every time 
                      // if it is same with the previous saved cohort.
                      var currentSelectedCases = JSON.stringify(self_.stats.studies) + JSON.stringify(self_.stats);

                      if (currentSelectedCases !== previousSelectedCases) {
                        vcSession.events.saveCohort(self_.stats,
                          cohortName, cohortDescription || '', false)
                          .done(function(response) {
                            self_.savedVC = response;
                            tooltip.find('.cohort-link').html(
                              '<a class="virtual-study-link" href="' + window.cbioURL +
                              'study?id=' + self_.savedVC.id + '" onclick="window.open(\'' +
                              window.cbioURL + 'study?id=' + self_.savedVC.id + '\')">' +
                              window.cbioURL + 'study?id=' + self_.savedVC.id + '</a>');

                            self_.hideLoading(tooltip);
                            self_.showShared(tooltip);
                            previousSelectedCases = currentSelectedCases;
                          })
                          .fail(function() {
                            self_.hideLoading(tooltip);
                            self_.hideDialog(tooltip);
                            self_.updateFailedMessage(tooltip,
                              '<i class="fa fa-exclamation-triangle"></i>' +
                              '<span class="left-space">' +
                              'Failed to share virtual study, ' +
                              'please try again later.</span>')
                            self_.showFailedInfo(tooltip);
                          });
                      } else {
                        self_.hideLoading(tooltip);
                        self_.showShared(tooltip);
                      }
                    }
                  });
                }
              });
              tooltip.find('.copy-cohort-btn').click(function() {
                self_.hideDialog(tooltip);
                self_.hideShared(tooltip);
                self_.hideLoading(tooltip);

                api.reposition();

                // Copy virtual study link to clipboard
                var temp = $("<input>");
                $("body").append(temp);
                temp.val(tooltip.find('.virtual-study-link').attr('href')).select();
                // execCommand('copy') allows to run commands to copy the contents of selected editable region.
                document.execCommand("copy");
                // Check if users copy url successfully
                if (temp.val() === tooltip.find('.virtual-study-link').attr('href')) {
                  self_.hideShared(tooltip);
                  self_.showAfterClipboard(tooltip);
                  api.reposition();
                }
                temp.remove();
              });
              tooltip.find('.cohort-name')
                .keyup(function() {
                  self_.checkVSName(tooltip);
                });
              this.createdQtip = true;
            },
            show: function() {
              var tooltip = $('.iviz-virtual-study-btn-qtip .qtip-content');
              self_.updateStats = true;
              self_.$nextTick(function() {
                // If user hasn't specific name only.
                if (tooltip.find('.cohort-name').val() === '') {
                  tooltip.find('.cohort-name').val(self_.virtualStudyName);
                }

                // If user hasn't specific description only.
                if (!tooltip.find('textarea').val() || tooltip.find('textarea').val() === self_.virtualStudyDescription) {
                  $.when(vcSession.utils.generateCohortDescription(self_.stats.studies))
                    .then(function(_desp) {
                      self_.updateStats = false;
                      self_.virtualStudyDescription = _desp
                      tooltip.find('textarea').val(_desp);
                    });
                }
                self_.checkVSName(tooltip);
              });
              self_.showDialog(tooltip);
              self_.hideLoading(tooltip);
              self_.hideShared(tooltip);
              self_.hideSaved(tooltip);
              self_.hideFailedInfo(tooltip);
              self_.hideAfterClipboard(tooltip);

              // Tell the tip itself to not bubble up clicks on it
              $($(this).qtip('api').elements.tooltip).click(function() {
                return false;
              });

            },
            visible: function() {
              // Tell the document itself when clicked to hide the tip and then unbind
              // the click event (the .one() method does the auto-unbinding after one time)
              $(document).one("click", function() {
                $(".virtual-study-btn").qtip('hide');
              });
            }
          },
          content: '<div><div class="dialog"><div class="input-group">' +
          '<input type="text" class="form-control cohort-name" ' +
          'placeholder="Virtual study Name"> <span class="input-group-btn">' +
          (self_.showSaveButton ? '<button class="btn btn-default save-cohort" type="button" disabled>Save</button>' : '') +
          (self_.showShareButton ? '<button class="btn btn-default share-cohort" type="button" disabled>Share</button>' : '') +
          '</span>' +
          '</div><div>' +
          '<textarea classe="form-control" rows="5" ' +
          'placeholder="Virtual study description (Optional)"></textarea>' +
          '</div></div>' +
          '<div class="saving" style="display: none;">' +
          '<i class="fa fa-spinner fa-spin"></i>' +
          '<span class="message"></span></div>' +
          '<div class="saved" style="display: none;">' +
          '<span class="message"></span>' +
          '</div>' +
          '<div class="shared" style="display: none;"><span class="cohort-link"></span>' +
          '<button class="btn btn-default btn-xs copy-cohort-btn" ' +
          'type="button">Copy</button></div>' +
          '<div class="after-clipboard" style="display: none;">' +
          '<span class="message">The URL has been copied to clipboard.</span>' +
          '</div>' +
          '<div class="failed" style="display: none;">' +
          '<span class="message"></span></div>' +
          '</div>'
        });
        $('.virtual-study-btn').click(function() {
          $('.virtual-study-btn').qtip('show');
        });
      }
    },
    ready: function() {
      this.createQtip();
    }
  });
})(window.Vue,
  window.$ || window.jQuery, window.vcSession, window.iViz);