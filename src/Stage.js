/**
 * Mathbox stage.
 *
 * Has a mathematical viewport, contains mathematical primitives, can be added to a three.js scene.
 */
MathBox.Stage = function (options, world, cssOverlay) {
  this.options = options || {};

  this._world = world;
  this.cssOverlay = cssOverlay;

  // Create array to hold primitives
  this.primitives = [];

  // Create material manager.
  this.materials = new MathBox.Materials(this);

  // Create attribute animator
  this.animator = new MathBox.Animator();
  this.duration = 0;

  // Create animateable camera controls.
  if (world) {
    this.cameraProxy = new MathBox.CameraProxy(world, this.options);
  }

  // Create viewport
  this.viewport({});

  // Create methods for available primitives.
  this.loadPrimitives();
};

// Inherit from Object3D to trick tQuery.
MathBox.Stage.prototype = new THREE.Object3D();

// Add attributes
MathBox.Attributes.mixin(MathBox.Stage);

// Make eventable
MicroEvent.mixin(MathBox.Stage);

MathBox.Stage.prototype = _.extend(MathBox.Stage.prototype, {

  /** 
   * Rendering loop
   */

  // Update before render.
  update: function () {
    var viewport = this._viewport;

    // Apply running animations.
    this.animator.update();

    // Update viewport transform.
    viewport.update(this);

    // Loop over all primitives.
    _.each(this.primitives, function (primitive) {
      // Adjust to viewport
      primitive.adjust(viewport);

      // Loop over renderables
      var renderables = primitive.renderables();
      _.each(renderables, function (renderable) {
        // Adjust visible renderables to viewport
        renderable.object && renderable.adjust(viewport);
      });
    });
  },

  /**
   * Primitive insertion/removal
   */

  add: function (object, animate) {
    // Overload Object3D.add

    if (object instanceof THREE.Object3D) {
      // Add to three.js scene tree
      return THREE.Object3D.prototype.add.call(this, object);
    }
    else {
      // Add to mathbox.
      this._add(object);

      // Apply insertion animation
      animate = this.animateOptions(animate);
      var opacity = object.style.get('opacity');
      if (animate && opacity > 0) {
        object.style.set('opacity', 0);

        this.animator.animate(
          object.style,
          { opacity: opacity },
          animate);
      }

      return this;
    }
  },

  remove: function (object, animate) {
    // Overload Object3D.remove

    if (object instanceof THREE.Object3D) {
      // Remove from three.js scene tree
      return THREE.Object3D.prototype.remove.call(this, object);
    }
    else {

      // Allow for removal via selector
      if (typeof object == 'string') {
        _.each(this.select(object), function (object) {
          this.remove(object, animate);
        }.bind(this));
      }

      // Remove from mathbox (callback).
      var remove = function () {
        this._remove(object);
      }.bind(this);

      // Apply removal animation
      animate = this.animateOptions(animate);
      var opacity = object.style.get('opacity');

      if (animate && opacity > 0) {
        // Schedule removal
        animate.callback = remove;
        this.animator.animate(
          object.style,
          { opacity: 0 },
          animate);

        // Mark as removed
        object.removed = true;
      }
      else {
        // Remove immediately
        remove();
      }

      return this;
    }
  },

  _add: function (primitive) {
    var materials = this.materials;

    if (this.primitives.indexOf(primitive) != -1) return;
    this.primitives.push(primitive);

    primitive.make();

    var renderables = primitive.renderables();

    _.each(renderables, function (renderable) {
      renderable.make(materials);
      renderable.object && this.add(renderable.object);
    }.bind(this));
  },

  _remove: function (primitive) {
    if (this.primitives.indexOf(primitive) == -1) return;

    this.primitives.splice(this.primitives.indexOf(primitive), 1);

    var renderables = primitive.renderables();
    _.each(renderables, function (renderable) {
      renderable.object && this.remove(renderable.object);
      renderable.destroy();
    }.bind(this));

    primitive.destroy();

  },

  /**
   * Primitive manipulation
   */

  select: function (selector, includeDead) {
    var out = [];

    // Allow literal object / array of objects
    if (typeof selector == 'object') {
      if (selector.constructor == Array) return selector;
      return [selector];
    }

    // Parse single selector
    var select = function (selector) {
      var out = [];

      // Universal selector
      if (selector == '*') {
        out = this.primitives.slice();
        out.push(this.viewport());
        out.push(this.cameraProxy);
        return out;
      }

      // See if selector is numeric
      if (selector == +selector) {
        // match by sequence number
        _.each(this.primitives, function (primitive) {
          if ((includeDead || !primitive.removed) && primitive.get('sequence') == selector) {
            out.push(primitive);
          }
        });
        return out;
      }

      // Parse css-like selector: #id, type, type[index]
      var match = selector.match(/^\s*#([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)?\s*$/);
      if (!match) return [];

      var type = match[2],
          id = match[1];

      if (id) {
        // match by ID
        _.each(this.primitives, function (primitive) {
          if ((includeDead || !primitive.removed) && primitive.get('id') == id) {
            out.push(primitive);
          }
        });
      }
      else {

        if (type == 'camera') {
          return this.cameraProxy && [this.cameraProxy] || [];
        }

        if (type == 'viewport') {
          return [this.viewport()];
        }

        if (type) {
          _.each(this.primitives, function (primitive) {
            if ((includeDead || !primitive.removed) && primitive.type() == type) {
              out.push(primitive);
            }
          });
        }
      }

      return out;
    }.bind(this);

    // Split joined selector into individual selectors and apply
    var out = [];
    selector = (''+selector).split(',');
    _.each(selector, function (selector) {
      out = out.concat(select(selector));
    });
    return out;
  },

  set: function (selector, options) {
    options = this.extractStyle(options);
    _.each(this.select(selector), function (primitive) {
      primitive.set(options);
    });
  },

  get: function (selector) {
    var animator = this.animator;

    selector = this.select(selector);
    if (selector.length < 1) return {};
    var object = selector[0];

    var out = animator.finalState(object);
    if (object.style) {
      var style = animator.finalState(object.style);
      out.style = style;
    }

    return out;
  },

  /**
   * Primitive animation
   */
  transition: function (duration) {
    if (duration !== undefined) {
      this.duration = duration;
      return this;
    }
    return this.duration;
  },

  animateOptions: function (animate, force) {
    var auto = this.duration;
    if (animate === true) animate = {};
    if (auto || force || (animate && (animate.delay || animate.duration))) {
      animate = _.extend({ duration: auto || 300 }, animate || {});
    }
    if (animate.delay || animate.duration) {
      return animate;
    }
  },

  animate: function (selector, options, animate) {
    var animator = this.animator;

    options = this.extractStyle(options);
    animate = this.animateOptions(animate, true);

    if (options.style) {
      _.each(this.select(selector), function (primitive) {
        animator.animate(primitive.style, options.style, animate);
      });
      options = _.extend({}, options);
      delete options.style;
    }

    _.each(this.select(selector), function (primitive) {
      animator.animate(primitive, options, animate);
    });
  },

  hurry: function (selector, keys, limit) {
    var animator = this.animator;

    _.each(this.select(selector, true), function (primitive) {
      animator.hurry(primitive, keys, limit);
      primitive.style && animator.hurry(primitive.style, keys, limit);
    });
  },

  halt: function (selector, keys) {
    var animator = this.animator;

    _.each(this.select(selector, true), function (primitive) {
      animator.stop(primitive, keys);
      primitive.style && animator.stop(primitive.style, keys);
    });
  },

  // Get/set viewport
  viewport: function (viewport) {
    if (viewport !== undefined) {
      if (!this._viewport || (viewport.type && viewport.type != this.options.viewport.type)) {
        this._viewport = MathBox.Viewport.make(viewport);
        var primitives = this.primitives.slice(),
            stage = this;
        _.each(primitives, function () {
          stage._remove(this);
          stage._add(this);
        })
      }
      else {
        this._viewport.set(viewport);
      }
      this.options.viewport = this._viewport.get();
      return this;
    }

    return this._viewport;
  },

  // Set camera properties
  camera: function (options) {
    _.each(this.select('camera'), function (camera) {
      camera.set(options);
    });

    return this;
  },

  // tQuery passthrough
  start: function () {
    this._world && this._world.start();
    return this;
  },

  stop: function () {
    this._world && this._world.stop();
    return this;
  },

  world: function () {
    return this._world;
  },

  /**
   * Primitive constructors
   */

  // Extract style properties from flattened options and put into style subkey for convenience.
  extractStyle: function (options) {
    var styles = MathBox.Style.prototype.defaults();
    var out = null;
    _.each(options, function (value, key) {
      if (styles[key] !== undefined) {
        delete options[key];
        out = out || {};
        out[key] = value;
      }
    });
    if (out) {
      options.style = _.extend(options.style || {}, out);
    }
    return options;
  },

  spawn: function (selector, options, animate) {
    if (MathBox.Primitive.types[selector]) {
      this[selector](options, animate);
      return this.primitives[this.primitives.length - 1];
    }
  },

  loadPrimitives: function () {
    _.each(MathBox.Primitive.types, function (klass, type) {
      this[type] = function (options, animate) {
        if (klass.validateArgs) {
          options = klass.validateArgs(options);
        }

        var object = new klass(this.extractStyle(options));
        this.add(object, animate);

        return this;
      }
    }.bind(this));
  },

});

