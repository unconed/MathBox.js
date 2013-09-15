/**
 * Mathbox stage.
 *
 * Has a mathematical viewport, contains mathematical primitives, can be added to a three.js scene.
 */
MathBox.Stage = function (options, world, overlay) {
  this.options = options = options || {};

  this._world = world;

  // Prepare overlay
  this.overlay = overlay;
  world && world.on('resize', function (width, height) {
    this.overlay.size(width, height);
    this.width = width;
    this.height = height;
  }.bind(this));

  // Create array to hold primitives
  this.primitives = [];

  // Create material manager.
  this.materials = new MathBox.Materials(this);

  // Create attribute animator
  this.animator = new MathBox.Animator();
  this._transition = 0;
  this._speed = 1;

  // Create animateable camera controls.
  if (world) {
    this.cameraProxy = new MathBox.CameraProxy(world, this.options);
  }

  // Create viewport
  this.viewport({});

  // Create methods for available primitives.
  this.loadPrimitives();

  // Set options
  if (options.transition !== undefined) {
    this.transition(options.transition);
  }
  if (options.speed !== undefined) {
    this.speed(options.speed);
  }
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
    var viewport = this._viewport,
        camera = this._world.tCamera(),
        width = this.width,
        height = this.height,
        speed = this._speed;

    // Update camera proxy object to grab user-changed coordinates.
    this.cameraProxy.update();

    // Apply running animations (incl overriding camera).
    var now = +new Date();
    if (!this.last) {
      this.last = now - 1000/60;
    }
    this.animator.update(speed * (now - this.last));
    this.last = now;

    // Update viewport transform.
    viewport.update(this);

    // Loop over all primitives.
    _.each(this.primitives, function (primitive) {
      // Adjust to viewport
      primitive.adjust(viewport, camera, width, height, this);

      // Loop over renderables
      var renderables = primitive.renderables();
      _.each(renderables, function (renderable) {
        // Adjust visible renderables to viewport
        renderable.isVisible() && renderable.adjust(viewport, camera, width, height, this);
      }.bind(this));
    }.bind(this));

    // Update sprite overlay
    this.overlay && this.overlay.update(camera);
  },

  /**
   * Primitive insertion/removal
   */

  add: function (object, animate) {
    // Overload Object3D.add

    if (object instanceof THREE.Object3D) {
      if (object instanceof MathBox.Sprite) {
        // Add to 2D overlay
        return this.overlay.add(object);
      }
      else {
        // Add to three.js scene tree
        return THREE.Object3D.prototype.add.call(this, object);
      }
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
      if (object instanceof MathBox.Sprite) {
        // Remove from 2D overlay
        return this.overlay.remove(object);
      }
      else {
        // Remove from three.js scene tree
        return THREE.Object3D.prototype.remove.call(this, object);
      }
    }
    else {

      // Allow for removal via selector
      if (typeof object == 'string') {
        return _.each(this.select(object), function (object) {
          this.remove(object, animate);
        }.bind(this));
      }

      // Don't remove singletons.
      if (object.singleton) return;

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

  /**
   * Add primitive to stage, instantiate its renderables.
   */
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

  /**
   * Remove primitive from stage, remove its renderables.
   */
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

  ///// Primitive manipulation //////////////

  /**
   * Select primitives by type or ID.
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

      // Parse css-like selector: #id, type
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

        // Special singletons
        if (type == 'camera') {
          return this.cameraProxy && [this.cameraProxy] || [];
        }

        if (type == 'viewport') {
          return [this.viewport()];
        }

        // Declared primitive types
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

  /**
   * Set properties on primitives.
   */
  set: function (selector, options) {
    options = this.extractStyle(options);
    _.each(this.select(selector), function (primitive) {
      primitive.set(options);
      if (options.style) {
        primitive.style.set(options.style);
      }
    });

    return this;
  },

  /**
   * Get (finalized) properties of a primitive.
   */
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

  ////////// Primitive animation ////////////////////////

  /**
   * Set default transition duration
   */
  transition: function (transition) {
    if (transition !== undefined) {
      this._transition = transition;
      return this;
    }
    return this._transition;
  },

  /**
   * Set speed multiplier
   */
  speed: function (speed) {
    if (speed !== undefined) {
      this._speed = speed;
      return this;
    }
    return this._speed;
  },

  /**
   * Resolve animation options
   */
  animateOptions: function (animate, force) {
    var auto = this._transition,
        speed = this._speed;

    if (animate === true) animate = {};
    if (auto || force || (animate && (animate.delay || animate.duration || animate.hold))) {
      animate = _.extend({ delay: 0, duration: auto || 0, hold: 0 }, animate || {});
    }
    if (animate && (animate.delay || animate.duration || animate.hold)) {
      return animate;
    }
  },

  /**
   * Animate primitives to give state.
   */
  animate: function (selector, options, animate) {
    var animator = this.animator;

    options = this.extractStyle(options);
    animate = this.animateOptions(animate, true);

    if (options.style) {
      _.each(this.select(selector), function (primitive) {
        if (animate) {
          animator.animate(primitive.style, options.style, animate);
        }
        else {
          primitive.style.set(options.style);
        }
      });
      options = _.extend({}, options);
      delete options.style;
    }

    _.each(this.select(selector), function (primitive) {
      if (animate) {
        animator.animate(primitive, options, animate);
      }
      else {
        primitive.set(options);
      }
    });

    return this;
  },

  /**
   * Clone primitives and animate to new properties.
   */
  clone: function (selector, options, animate) {
    _.each(this.select(selector), function (primitive) {
      var original = this.get(primitive);

      // Reset creation ID of clone
      delete original.sequence;

      // Sort options into animatable and non-animatable
      var newOptions = _.extend({}, options);
      var remove = [];
      _.each(options, function (value, key) {
        if (key == 'id' || typeof value == 'boolean' || value === null) {
          original[key] = options[key];
          remove.push(key);
        }
      });
      _.each(remove, function (key) { delete newOptions[key] });

      // Force ID change
      if (original.id == primitive.get('id')) {
        original.id = (original.id || '') + '-clone';
      }

      // Spawn clone and animate it to new properties
      var copy = this.spawn(primitive.type(), original, { duration: 0 });
      this.animate(copy, newOptions, animate);
    }.bind(this));

    return this;
  },

  /**
   * Hurry primitives currently being animated.
   */
  hurry: function (selector, keys, factor) {
    var animator = this.animator;

    _.each(this.select(selector, true), function (primitive) {
      animator.hurry(primitive, keys, factor);
      primitive.style && animator.hurry(primitive.style, keys, factor);
    });

    return this;
  },

  /**
   * Stop animations on primitives
   */
  halt: function (selector, keys) {
    var animator = this.animator;

    _.each(this.select(selector, true), function (primitive) {
      animator.stop(primitive, keys);
      primitive.style && animator.stop(primitive.style, keys);
    });

    return this;
  },

  /**
   * Change properties of viewport
   */
  viewport: function (viewport) {
    if (viewport !== undefined) {
      // If changing viewport type, renderables need to be re-instantiated
      // to regenerate shaders.
      if (!this._viewport || (viewport.type && viewport.type != this.options.viewport.type)) {
        // Weave in existing properties
        if (this._viewport) {
          viewport = _.extend({}, this._viewport.get(), viewport);
        }

        // Make viewport
        this._viewport = MathBox.Viewport.make(viewport);

        // Reinstantiate all primitives to renegerate shaders.
        var primitives = this.primitives.slice(),
            stage = this;
        _.each(primitives, function (primitive) {
          stage._remove(primitive);
          stage._add(primitive);
        });
      }
      else {
        // Set properties directly
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

  //////////// Primitive constructors ////////////////

  /**
   * Extract style properties from flattened options and put into style subkey for convenience.
   */
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

  /**
   * Spawn primitive by type
   */
  spawn: function (selector, options, animate) {
    if (MathBox.Primitive.types[selector]) {
      this[selector](options, animate);
      return this.primitives[this.primitives.length - 1];
    }

    return this;
  },

  /**
   * Load all declared primitives and make spawning methods for them
   */
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

