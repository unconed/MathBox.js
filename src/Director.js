/**
 * Script-based director.
 *
 * Applies operations to mathbox one by one by stepping forward.
 * Can step backwards by automatically applying inverse operations.
 */
MathBox.Director = function (stage, script) {
  this._stage = stage;
  this.script = script;
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
    if (reset || !this.clocks[step]) this.clocks[step] = +new Date();
    return (+new Date() - this.clocks[step]) * .001;

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
        options = op[2],
        animate = op[3],
        primitive;

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
          ]);
        })
        break;

      case 'animate':
      case 'set':
        targets = stage.select(selector);
        _.each(targets, function (primitive) {
          var duration = Math.min(300, (animate && (animate.duration !== undefined)) ? animate.duration : 300);
          inverse.push([
            verb,
            primitive.singleton || primitive.get('sequence'),
            stage.get(primitive),
            { duration: duration },
          ]);
        });
        break;
    }

    return inverse;
  },

  /**
   * Apply the given script step.
   */
  apply: function (step, rollback, instant) {
    var stage = this._stage;

    _.each(step, function (op) {
      var verb = op[0] || '',
          selector = op[1] || '',
          options = op[2] || {},
          animate = op[3] || {};

      if (verb == 'remove') animate = options;

      if (rollback) {
        var inverse = this.invert(op);
        var args = [0, 0].concat(inverse);
        Array.prototype.splice.apply(rollback, args);
      }

      if (instant) {
        if (animate) {
          animate = _.extend({}, animate);
          animate.delay = 0;
          animate.duration = animate.duration / 2;
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

    var step = this.script[this.step];
    var rollback = this.rollback[this.step] = [];
    this.step++;

    var apply = function () {
      this.apply(step, rollback, instant || this.skipping());

      this.clock(this.step, true);

      this.emit('go', this.step, 1);
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
    var step = this.script[this.step];
    var rollback = this.rollback[this.step];

    var apply = function () {
      this.apply(rollback, null, instant || this.skipping());
      delete this.rollback[this.step];

      this.emit('go', this.step, -1);
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

