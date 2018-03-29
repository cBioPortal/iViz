/**
 * @author Hongxin Zhang on 11/15/17.
 */
'use strict';
(function(Vue, ProgressBar) {
  Vue.component('progressBar', {
    template:
      '<div id="{{divId}}" class="study-view-progress-bar"></div>',
    props: {
      type: {
        type: String,
        default: 'percentage'
      },
      disable: {
        type: Boolean,
        default: false
      },
      status: {
        type: Number,
        default: 0
      },
      divId: {
        type: String
      },
      opts: {
        default: function() {
          return {};
        },
        type: Object
      }
    },
    data: function() {
      return {
        intervals: {}
      }
    },
    methods: {
      initLine: function() {
        var _self = this;
        var opts = _.extend({
          strokeWidth: 4,
          easing: 'easeInOut',
          duration: 1400,
          color: '#2986e2',
          trailColor: '#eee',
          trailWidth: 1,
          svgStyle: {width: '100%', height: '100%'},
          text: {
            style: {
              // Text color.
              // Default: same as stroke color (options.color)
              color: '#000',
              'text-align': 'center',
              transform: null
            },
            autoStyleContainer: false
          },
          step: function(state, bar) {
            bar.setText(Math.round(bar.value() * 100) + ' %');
          }
        }, _self.opts);
        if (_self.bar) {
          _self.bar.destroy();
        }
        _self.bar = new ProgressBar.Line('#' + _self.divId, opts);
        _self.bar.animate(_self.status);
      },
      cancelAllIntervals: function() {
        _.each(this.intervals, function(interval) {
          window.clearInterval(interval);
          interval = null;
        })
      },
      cancelInterval: function(type) {
        if (this.intervals[type]) {
          window.clearInterval(this.intervals[type]);
          this.intervals[type] = null;
        }
      },
      initialInterval: function() {
        var self = this;
        if (self.type === 'percentage') {
          self.intervals.percentage = window.setInterval(function() {
            self.status += Math.floor(Math.random() * 5) * 0.01;
          }, self.opts.duration || 500);
        } else if (self.type = 'infinite') {
          self.intervals.infinite = window.setInterval(function() {
            self.status += 0.5;
          }, self.opts.duration || 500);
        }
      }
    },
    watch: {
      'status': function(newVal, oldVal) {
        if (this.type === 'percentage' && newVal >= 0.9) {
          this.cancelInterval('percentage');
        }
        if (newVal > this.bar.value()) {
          this.bar.animate(newVal);
        }
      },
      'opts': function() {
        this.initLine();
      },
      'disable': function() {
        this.cancelAllIntervals();
      },
      'type': function(newVal) {
        this.cancelAllIntervals();
        this.initialInterval();
        this.disable = false;
        if (newVal === 'infinite') {
          this.opts = {
            duration: 300,
            step: function(state, bar) {
              bar.setText('Loading...');
            }
          };
          this.status = 0.5;
        }
      }
    },
    ready: function() {
      var self = this;
      self.initLine();
      self.initialInterval();
    }
  });
})(window.Vue,
  window.ProgressBar);