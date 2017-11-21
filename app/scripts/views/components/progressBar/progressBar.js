
/**
 * @author Hongxin Zhang on 11/15/17.
 */
'use strict';
(function(Vue, ProgressBar) {
  Vue.component('progressBar', {
    template:
      '<div id="{{divId}}" class="study-view-progress-bar"></div>',
    props: {
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
      }
    },
    watch: {
      'status': function(newVal) {
        this.bar.animate(newVal);
      },
      'opts': function() {
        this.initLine();
      }
    },
    ready: function() {
      this.initLine();
    }
  });
})(window.Vue,
  window.ProgressBar);