/**
 * Attribute animator. Works on any object with the Attributes.js mixin.
 *
 * Requires manual synchronization by calling animator.update().
 */
MathBox.Animator = function () {
  this.active = [];
};

MathBox.Animator.now = 1;

MathBox.Animator.prototype = {

  /**
   * Return the final state of an object after all currently queued animations have run their course.
   */
  finalState: function (object) {
    var state = _.extend({}, object.get());
    if (object.__queue) {
      _.each(object.__queue, function (queue, key) {
        _.each(queue, function (op) {
          if (op.to) {
            state[key] = op.to;
          }
        });
      });
    }
    return state;
  },

  /**
   * Attach animator to an object.
   */
  attach: function (object) {
    if (object.__queue) return;
    if (!object.__attributes) throw "Cannot attach to object without attributes";

    var animator = this;

    // Override set method to abort running animations.
    var set = object.set;
    object.set = function (object, value, ignore) {

      if (!ignore) {
        var stop = object;

        // Argument parsing
        if (object === undefined || object === null) {
          return;
        }
        else if (object.constructor == String) {
          stop = {};
          stop[object] = value;
        }

        // Stop all animations on the given keys
        animator.stop(this, stop);
      }

      // Pass through to Attributes
      set.call(this, object, value);
    };

    // Prepare animation queue
    var queue = {};
    object.__queue = queue;
    object.__animations = 0;
  },

  /**
   * Hurry all animations on an object by speeding by a factor.
   */
  hurry: function (object, keys, factor) {
    factor = factor || 4;

    // Reduce
    _.each(keys || object.__queue, function (queue, key) {
      _.each(object.__queue[key], function (op) {
        op.hurry(factor);
      });
    }.bind(this));
  },

  /**
   * Stop all animations on an object.
   */
  stop: function (object, keys) {
    // Dequeue all animations, applying instantly.
    _.each(keys || object.__queue, function (queue, key) {
      while (object.__queue[key]) {
        this.dequeue(object, key, true);
      }
    }.bind(this));
  },

  /**
   * Animate a set of attributes on an object.
   */
  animate: function (object, attributes, options) {
    var defaults = {
      duration: 300//,
    };
    options = _.extend(defaults, options || {});

    this.attach(object);

    _.each(attributes, function (value, key) {
      // Init queue if necessary.
      var queue = object.__queue[key] = object.__queue[key] || [];

      // Queue delay
      if (options.delay) {
        var delay = new MathBox.Animator.Delay(object, key, options.delay);
        queue.push(delay);

        if (object.__animations++ == 0) {
          this.active.push(object);
        }
      }

      // Validate target value
      if (object.__validators[key]) {
        value = object.__validators[key].call(object, value);
      }

      // Queue new animation
      var animation = new MathBox.Animator.Animation(
                        object, key, value, options.duration, options.callback, options.ease);
      queue.push(animation);

      // Queue hold
      if (options.hold) {
        var hold = new MathBox.Animator.Delay(object, key, options.hold);
        queue.push(hold);

        if (object.__animations++ == 0) {
          this.active.push(object);
        }
      }

      // Keep track of animating objects
      if (object.__animations++ == 0) {
        this.active.push(object);
      }
    }.bind(this));
  },

  /**
   * Remove current animation on an object attribute.
   */
  dequeue: function (object, key, apply) {

    // Check if key is animated
    var queue = object.__queue[key];
    if (!queue) return;

    // Remove from front of queue.
    var animation = queue.shift();
    if (queue.length == 0) delete object.__queue[key];

    // Apply animation instantly
    if (apply) {
      animation.skip();
    }

    // Keep track of animating objects
    if (--object.__animations == 0) {
      this.active.splice(this.active.indexOf(object), 1);
    }
  },

  /**
   * Update all currently running animations.
   */
  update: function (speed) {
    MathBox.Animator.now += speed; // Use synchronized clock

    var active = this.active.slice();
    _.each(active, function (object) {
      // Used to make queued animations match up at sub-frame times.
      var offset = 0;
      _.each(object.__queue, function update(queue, key) {
        // Write out animated attribute.
        var animation = queue[0];
        value = animation.apply(offset || 0);

        // Remove completed animations.
        if (animation.done()) {
          offset = animation.extra();
          this.dequeue(object, key);

          // Recurse into next animation.
          if (queue[0]) {
            update.call(this, queue, key);
          }
        }
      }.bind(this));
    }.bind(this));
  }//,
}

/**
 * Non-animation that just adds a delay.
 */
MathBox.Animator.Delay = function (object, key, duration) {
  this.object = object;
  this.key = key;
  this.duration = duration;
  this.start = 0;
  this.fraction = 0;
}

MathBox.Animator.Delay.prototype = {

  init: function (offset) {
    this.start = MathBox.Animator.now - (offset || 0);
  },

  apply: function (offset) {
    if (!this.start) this.init(offset);
    if (this.duration > 0) {
      this.fraction = Math.min(1, (MathBox.Animator.now - this.start) / this.duration);
    }
    else {
      this.fraction = 1;
    }
  },

  skip: function () {
    this.duration = 0;
  },

  hurry: function (factor) {
    this.duration = this.duration * this.fraction
                  + this.duration * (1 - this.fraction) / factor;
  },

  extra: function () {
    return MathBox.Animator.now - this.start - this.duration;
  },

  done: function () {
    return this.fraction == 1;
  }//,
}

/**
 * Animation on a single attribute.
 */
MathBox.Animator.Animation = function (object, key, value, duration, callback, ease) {
  this.object = object;
  this.key = key;
  this.from = null;
  this.to = value;
  this.duration = duration;
  this.start = 0;
  this.fraction = 0;
  this.callback = callback;
  this.ease = ease;
};

MathBox.Animator.Animation.prototype = {

  init: function (offset) {
    this.start = MathBox.Animator.now - (offset || 0);
    if (this.from === null) this.from = this.object.get(this.key);
    if (this.from === undefined) {
      this.from = 0;
    }
  },

  apply: function (offset) {
    if (!this.start) this.init(offset);

    var object = this.object;
    var from = this.from;
    var to = this.to;
    var key = this.key;
    var ease = this.ease;

    // Calculate animation progress / fraction.
    var fraction;
    if (this.duration > 0) {
      fraction = Math.min(1, (MathBox.Animator.now - this.start) / (this.duration || 1));
    }
    else {
      fraction = 1;
    }
    this.fraction = fraction;

    // Simple easing support.
    var rolloff;
    switch (ease) {
      case 'in':
        rolloff = 1 - (1 - fraction) * (1 - fraction);
        break;
      case 'out':
        rolloff = fraction * fraction;
        break;
      case 'linear':
        rolloff = fraction;
        break;
      default:
        rolloff = .5-.5*Math.cos(fraction * π);
        break;
    }

    // Linear interpolation
    function lerp(from, to) {
      return from + (to - from) * rolloff;
    }

    // Interpolate between two arbitrary values/objects.
    function process(from, to) {

      // Handle default cases.
      if (to === undefined) {
        to = from;
      }
      if (from === undefined) {
        from = to;
      }
      if (to === from) {
        return from;
      }

      // Sanity type check.
      if (typeof from != typeof to) {
        console.log(object, key)
        throw "Data type mismatch between from/to values in animator. "+ key +': '+ from + ' ('+ from.constructor +')' + ", " + to + "("+ to.constructor +")";
      }

      // Type-specific behavior.
      var out;
      switch (typeof to) {
        default:
        case 'string':
          throw "Unimplemented value type in animator. ("+(typeof to)+")";

        case 'function':
          return function () {
            return process(from.apply(this, arguments), to.apply(this, arguments));
          };

        case 'boolean':
          return (fraction > .5) ? to : from;

        case 'number':
          return lerp(from, to);

        case 'object':
          if (!from) {
            return to;
          }
          if (!to) {
            return from;
          }
          if (to.constructor == Array) {
            out = [];
            _.loop(from.length, function (i) {
              out[i] = process(from[i], to[i]);
            })
            return out;
          }
          if (to.constructor == THREE.Matrix4) {
            out = new THREE.Matrix4()
            for (var i = 0; i < 16; ++i) {
              out.elements[i] = lerp(from.elements[i], to.elements[i]);
            }
            return out;
          }
          if (to.constructor == THREE.Vector3) {
            out = new THREE.Vector3()
            out.x = lerp(from.x, to.x);
            out.y = lerp(from.y, to.y);
            out.z = lerp(from.z, to.z);
            return out;
          }
          if (to.constructor == THREE.Color) {
            out = new THREE.Color()
            out.r = lerp(from.r, to.r);
            out.g = lerp(from.g, to.g);
            out.b = lerp(from.b, to.b);
            return out;
          }
          return (fraction > .5) ? to : from;
          //throw "Unimplemented value type in animator. "+(typeof to)+" ("+ to.constructor +")";
      }
    }

    var value = process(from, to);
    this.object.set(this.key, value, true);
  },

  hurry: function (factor) {
    this.duration = this.duration * this.fraction
                  + this.duration * (1 - this.fraction) / factor;
  },

  skip: function () {
    this.duration = 0;
    this.fraction = 1;
    this.done();
  },

  extra: function () {
    return MathBox.Animator.now - this.start - this.duration;
  },

  done: function () {
    if (this.fraction == 1) {
      // Set final value.
      this.object.set(this.key, this.to, true);

      this.callback && this.callback();
      this.callback = null;
      return true;
    }
    return false;
  }//,
};

