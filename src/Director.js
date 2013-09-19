/**
 * Script-based director.
 *
 * Applies operations to mathbox one by one by stepping forward.
 * Can step backwards by automatically applying inverse operations.
 */
MathBox.Director = function (stage, script) {
  this._stage = stage;
  this.script = script || [];
  this.rollback = {};
  this.clocks = {};

  this.step = 0;
  this.lastCommand = 0;

  this.time = 0;
  this.lastTime = +new Date();
};

MathBox.Director.prototype = {

  /**
   * Get clock for slide
   */
  clock: function (step, reset) {
    if (step > this.step) {
      return 0;
    }

    var now = +new Date();
    var delta = now - this.lastTime;
    this.time += delta * this.stage().speed();
    this.lastTime = now;

    if (reset || !this.clocks[step]) this.clocks[step] = this.time;
    return (this.time - this.clocks[step]) * .001;
  },

  /**
   * Invert the given operation (which hasn't been applied yet).
   */
  invert: function (op) {
    var stage = this._stage;

    var inverse = [],
        targets;

    var verb = op[0],
        selector = op[1],
        options = op[2] || {},
        animate = op[3],
        primitive;

    if (verb == 'remove') {
      animate = options;
    }

    // Reverse timings
    var duration = (animate && animate.duration !== undefined) ? animate.duration / 4 : 0;
    var delay = (animate && animate.delay !== undefined) ? animate.delay / 4 : 0;
    var hold = (animate && animate.hold !== undefined) ? animate.hold / 4 : 0;
    animate = { delay: hold, duration: duration, hold: delay };

    switch (verb) {
      case 'add':
        targets = [0];
        // Fall through
      case 'clone':
        targets = targets || stage.select(selector);
        _.each(targets, function (target, i) {
          inverse.push([
            'remove',
            options.sequence || (MathBox.Primitive.sequence + 1 + i),
            animate,
          ]);
        })
        break;

      case 'remove':
        targets = stage.select(selector);
        _.each(targets, function (primitive) {
          inverse.push([
            'add',
            primitive.type(),
            stage.get(primitive),
            animate,
          ]);
        })
        break;

      case 'animate':
      case 'set':
        targets = stage.select(selector);

        _.each(targets, function (primitive) {
          var props = stage.get(primitive);
          var reverted = {};
          for (i in options) {
            if (props.style && props.style[i] !== undefined) reverted[i] = props.style[i];
            else reverted[i] = props[i];
          }
//          log('reverted', props, options, reverted)

          inverse.push([
            verb,
            primitive.singleton || primitive.get('sequence'),
            reverted,
            animate,
          ]);
        });
        break;
    }

    return inverse;
  },

  /**
   * Correct reversed delays by measuring total track length and adding the missing final / reversed initial delay.
   */
  invertDelay: function (rollback) {

    // Get property names for op
    function getProps(op) {
      var verb = op[0],
          options = op[2] || {};

      var props = ['opacity'];
      if (verb == 'animate') {
        props = [];
        for (i in options) {
          if (i == 'style') {
            for (j in options.style) {
              props.push(j);
            }
          }
          else {
            props.push(i);
          }
        }
      }
//      log('getProps', op, props);
      return props;
    }

    // New rollback
    var out = [], i;

    // Collect lengths
    var lengths = {};
    rollback.forEach(function (op) {
      var verb = op[0],
          selector = op[1] || '',
          options = op[2] || {},
          animate = op[3] || {};

      if (verb == 'set') return null;
      if (verb == 'add') {
        selector = options.sequence;
      }
      if (verb == 'remove') {
        animate = options;
      }

      var props = getProps(op);
      props.forEach(function (prop) {
        var key = [selector,prop].join('.');
        if (!lengths[key]) lengths[key] = [];
        animate = animate || {};
        lengths[key].push((animate.delay||0) + (animate.duration||0) + (animate.hold||0));
      });
    });

    // Get longest track
    var max = 0;
    for (i in lengths) {
      var length = lengths[i] = lengths[i].reduce(function (a, b) { return a + b; });
      max = Math.max(max, length);
    }
//    log('max', max);

    // Assign reverse timings
    rollback.forEach(function (op) {
//      log('rollback', op);
      var verb = op[0],
          selector = op[1] || '',
          options = op[2] || {},
          animate = op[3] || {},
          type;

      if (verb == 'set') {
        return out.push(op);
      }
      if (verb == 'add') {
        type = selector;
        selector = options.sequence;
      }
      if (verb == 'remove') {
        animate = options;
      }

      var props = getProps(op);
      props.forEach(function (prop) {
        var key = [selector,prop].join('.');

        var delay = (animate.delay || 0);
        var duration = animate.duration || 0;
        var hold = (animate.hold || 0);

        if (lengths[key] !== undefined) {
          delay += max - lengths[key];
//          log('animate y', delay, duration, hold);
          delete lengths[key];
        }
        else {
//          log('animate n', delay, duration, hold);
        }
        animate = { delay: delay, duration: duration, hold: hold };

        if (verb == 'add') {
          out.push([verb, type, options, animate]);
        }
        if (verb == 'remove') {
          out.push([verb, selector, animate]);
        }
        else {
          var o = {};
          o[prop] = (options.style && options.style[prop] !== undefined) ? options.style[prop] : options[prop];
          out.push([verb, selector, o, animate]);
        }
      });
    });

    return out;
  },

  /**
   * Apply the given script step.
   */
  apply: function (step, rollback, instant, skipping) {
    var stage = this._stage;

    _.each(step, function (op) {
      var verb = op[0] || '',
          selector = op[1] || '',
          options = op[2] || {},
          animate = op[3] || {};

      if (verb == 'remove') animate = options;

      if (rollback) {
//        console.log('inverting', op);
        var inverse = this.invert(op);
        var args = [0, 0].concat(inverse);
        Array.prototype.splice.apply(rollback, args);
      }

      if (skipping) {
        if (animate) {
          animate = _.extend({}, animate);
          animate.delay = animate.delay / 2;
          animate.duration = animate.duration / 2;
          animate.hold = animate.hold / 2;
        }
      }
      if (instant) {
        animate = { delay: 0, duration: 0, hold: 0 };
        if (verb == 'animate') {
          verb = 'set';
        }
      }

      switch (verb) {
        case 'clone':
          stage.clone(selector, options, animate);
          break;

        case 'add':
          var primitive = stage.spawn(selector, options, animate);
          break;

        case 'remove':
          _.each(stage.select(selector), function (primitive) {
            stage.remove(primitive, animate);
          });
          break;

        case 'set':
          var targets = stage.select(selector);
          var array = options.constructor == Array;
          _.each(targets, function (target, i) {
            stage.set(target, array ? options[i] : options);
          });
          break;

        case 'animate':
          var targets = stage.select(selector);
          var array = options.constructor == Array;
          _.each(targets, function (target, i) {
            var opts = array ? options[i] : options;
            stage.animate(target, opts, animate);
          });
          break;
      }
    }.bind(this));

    return this;
  },

  /**
   * Insert new script step after current step and execute.
   */
  insert: function (script) {
    // Allow array of ops and single op
    if (script[0].constructor != Array) {
      script = [script];
    }

    // Insert step into the script and execute immediately.
    this.script.splice(this.step, 0, script);

    this.forward();

    return this;
  },

  /**
   * Is at the given step.
   */
  is: function (step) {
    if (!this.script.length) return false;

    while (step < 0) step += this.script.length + 1;
    while (step >= this.script.length + 1) step -= this.script.length + 1;

    return step == this.step
  },

  isFirst: function () {
    return this.is(0);
  },

  isLast: function () {
    return this.is(-1);
  },

  /**
   * Go to the given step in the script.
   */
  go: function (step, instant) {
    if (!this.script.length) return;

    while (step < 0) step += this.script.length + 1;
    while (step >= this.script.length + 1) step -= this.script.length + 1;

    while (step > this.step) { this.forward(instant); }
    while (step < this.step) { this.back(instant); }
  },

  /**
   * Helper to detect rapid skipping, so existing animations can be sped up.
   */
  skipping: function () {
    var t = +new Date(), skip = false;
    if (t - this.lastCommand < 500) {
      skip = true;
    }
    this.stage().hurry('*');
    this.lastCommand = t;
    return skip;
  },

  /**
   * Go one step forward.
   */
  forward: function (instant, delay) {
    if (this.step >= this.script.length) return;

    var index = this.step;
    var step = this.script[index];
    var rollback = this.rollback[index] = [];
    this.step++;

    var apply = function () {
      this.apply(step, rollback, instant, !instant ? this.skipping() : false);
      this.rollback[index] = this.invertDelay(rollback);

      this.clock(index + 1, true);
      this.emit('go', index + 1, 1);
    }.bind(this);

    if (delay) {
      setTimeout(apply, +delay);
    }
    else {
      apply();
    }

    return this;
  },

  /**
   * Go one step backward.
   */
  back: function (instant, delay) {
    if (this.step <= 0) return;

    this.step--;
    var index = this.step;
    var rollback = this.rollback[index];

    var apply = function () {
      this.apply(rollback, null, instant || this.skipping());
      delete this.rollback[index];

      this.emit('go', index, -1);
    }.bind(this);

    if (delay) {
      setTimeout(apply, +delay);
    }
    else {
      apply();
    }

    return this;
  },

  stage: function () {
    return this._stage;
  },

};

// Proxy methods to stage, retain own chainability.
_.each(MathBox.Stage.prototype, function (f, key) {
  if (!MathBox.Director.prototype[key]) {
    MathBox.Director.prototype[key] = function () {
      var ret = this.stage[f].apply(this.stage, arguments);
      if (ret === this.stage) return this;
      return ret;
    };
  }
});

MicroEvent.mixin(MathBox.Director);

