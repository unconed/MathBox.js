/**
 * MathBox.js. Math plotting tool for three.js / webgl.
 */

// Math!
var π = Math.PI,
    τ = π * 2;

// Check dependencies.
(function (deps) {
  for (var i in deps) {
    if (!window[i]) throw "Error: MathBox requires " + deps[i];
  }
})({
  'THREE': 'Three.js',
  'tQuery': 'tQuery.js (bundle)',
  'ThreeBox': 'ThreeBox.js',
  'ThreeRTT': 'ThreeRTT.js'//,
});

// Namespace.
window.MathBox = {};

// Shortcut static call.
window.mathBox = function (element, options) {
  // Omit element (use body)
  if (element && !(element instanceof Node)) {
    options = element;
    element = null;
  }

  return tQuery.createWorld(options).mathBox(element, options);
};

// Fetch shader from <script> tag by id
MathBox.getShader = function (id) {
  var elem = document.getElementById(id);
  return elem && elem.innerText || id;
};

Math.sign = function (x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
};
MathBox.Attributes = function () {
};

MathBox.Attributes.prototype = {

  get: function (key) {
    if (key === undefined) return this.__attributes || {};
    if (!this.__attributes) return undefined;
    return this.__attributes[key];
  },

  set: function (object, value) {
    if (!this.__attributes) this.__attributes = {};
    if (!this.__validators) this.__validators = {};

    var changed = {},
        validators = this.__validators,
        attributes = this.__attributes,
        that = this;

    function validate(key, value) {
      if (validators[key] === undefined) {
        var method = 'validate' + key.charAt(0).toUpperCase() + key.slice(1);
        validators[key] = that[method] || false;
      }
      if (validators[key]) return validators[key](value);
      return value;
    }

    function set(key, value) {
      try {
        value = validate(key, value);
        changed[key] = value;
        attributes[key] = value;
      }
      catch (e) { throw "Exception setting '" + key + "' to '" + value + "': " + e; }
    }

    if (object === undefined || object === null) {
      return;
    }
    else if (object.constructor == String) {
      set(object, value);
    }
    else {
      _.each(object, function (value, key) {
        set(key, value);
      });
    }

    this.emit('change', changed);
  }//,

};

// Microeventable
MicroEvent.mixin(MathBox.Attributes);

MathBox.Attributes.mixin = function (klass) {
  _.each(['get', 'set', 'on', 'emit'], function (key) {
    klass.prototype[key] = MathBox.Attributes.prototype[key];
  })
};
MathBox.Animator = function () {
  this.active = [];
};

MathBox.Animator.prototype = {

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

  hurry: function (object, keys, limit) {
    limit = limit || 300;

    // Remove delays and cap duration per effect
    _.each(keys || object.__queue, function (queue, key) {
      _.each(object.__queue[key], function (op) {
        if (op instanceof MathBox.Animator.Delay) {
          op.duration = 0;
        }
        if (op instanceof MathBox.Animator.Animation) {
          op.duration = Math.min(op.duration, limit);
        }
      });
    }.bind(this));
  },

  stop: function (object, keys) {
    // Dequeue all animations, applying instantly.
    _.each(keys || object.__queue, function (queue, key) {
      while (object.__queue[key]) {
        this.dequeue(object, key, true);
      }
    }.bind(this));
  },

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
        value = object.__validators[key](value);
      }

      // Queue new animation
      var animation = new MathBox.Animator.Animation(
                        object, key, value, options.duration, options.callback, options.ease);
      queue.push(animation);

      // Keep track of animating objects
      if (object.__animations++ == 0) {
        this.active.push(object);
      }
    }.bind(this));
  },

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

  update: function () {
    _.each(this.active, function (object) {
      _.each(object.__queue, function update(queue, key) {
        // Write out animated attribute.
        var animation = queue[0];
        value = animation.apply();

        // Remove completed animations.
        if (animation.done()) {
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

MathBox.Animator.Delay = function (object, key, duration) {
  this.object = object;
  this.key = key;
  this.duration = duration;
  this.start = 0;
  this.fraction = 0;
}

MathBox.Animator.Delay.prototype = {

  init: function () {
    this.start = +new Date();
  },

  apply: function () {
    if (!this.start) this.init();
    if (this.duration > 0) {
      this.fraction = Math.min(1, (+new Date() - this.start) / this.duration);
    }
    else {
      this.fraction = 1;
    }
  },

  skip: function () {
    this.duration = 0;
  },

  done: function () {
    return this.fraction == 1;
  }//,
}

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

  init: function () {
    this.start = +new Date();
    if (this.from === null) this.from = this.object.get(this.key);
    if (this.from === undefined) {
      this.from = 0;
    }
  },

  apply: function () {
    if (!this.start) this.init();

    var object = this.object;
    var from = this.from;
    var to = this.to;
    var key = this.key;
    var ease = this.ease;

    var fraction;
    if (this.duration > 0) {
      fraction = Math.min(1, (+new Date() - this.start) / (this.duration || 1));
    }
    else {
      fraction = 1;
    }
    this.fraction = fraction;

    var rolloff;
    switch (ease) {
      case 'in':
        rolloff = 1 - (1 - fraction) * (1 - fraction);
        break;
      case 'out':
        rolloff = fraction * fraction;
        break;
      default:
        rolloff = .5-.5*Math.cos(fraction * π);
        break;
    }

    function lerp(from, to) {
      return from + (to - from) * rolloff;
    }

    function process(from, to) {
      // Handle default cases.
      if (to === undefined) {
        to = from;
      }
      if (to === from) {
        return from;
      }

      if (typeof from != typeof to) {
        console.log(object, key)
        throw "Data type mismatch between from/to values in animator. "+ key +': '+ from + ' ('+ from.constructor +')' + ", " + to + "("+ to.constructor +")";
      }

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
          throw "Unimplemented value type in animator. "+(typeof to)+" ("+ to.constructor +")";
      }
    }

    this.object.set(this.key, process(from, to), true);
  },

  skip: function () {
    this.duration = 0;
    this.fraction = 1;
    this.done();
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

MathBox.Materials = function (stage) {
  this.stage = stage;
  this.list = [];
}

MathBox.Materials.prototype = {

  generic: function (options) {
    // Prepare new shadergraph factory.
    var factory = this.factory();
    options = options || {};
    var shaders = options.shaders || {};

    // Read out vertex position.
    if (shaders.position) {
      shaders.position(factory, this);
    }
    else {
      this.position(factory, options);

      // Apply viewport transform
      if (!options.absolute) {
        this.viewport(factory);
      }
    }

    // Apply finalizing shaders.
    return this.finalize(factory, options);
  },

  position: function (factory, options) {
    options = options || {};

    // Default position snippet
    var position = {
      mesh: 'getPositionNormal',
    }[options.type] || 'getPosition';

    // Fetch vertex position from three.js attributes
    factory
      .snippet(position)
      .snippet('mathTransform')

    return factory;
  },

  factory: function () {
    return new ShaderGraph.Factory();
  },

  finalize: function (factory, options) {
    // Read out shaders
    options = options || {};
    var shaders = options.shaders || {};

    // Transform point to view.
    factory
      .snippet('projectToView')

    if (shaders.material) {
      // Override material shader
      shaders.material(factory, this);
    }
    else {
      // Add default fragment shader
      var fragment = {
        points: 'fragmentSolidPoint',
        mesh: options.shaded ? 'fragmentShaded' : 'fragmentSolid',
      }[options.type] || 'fragmentSolid';

      factory.material('vertexOutput', fragment);
    }

    // Finish graph and compile program
    var graph = factory.end(),
        program = graph.compile();

    // Create Three.js material
    var material = new THREE.ShaderMaterial({
      uniforms: program.uniforms,
      attributes: program.attributes,
      vertexShader: program.vertexShader,
      fragmentShader: program.fragmentShader//,
    });

    // Set necessary three.js flags
    if (options.wireframe) {
      material.wireframe = true;
    }

    // Add .apply methods to update uniforms/attribs.
    var apply = this.apply.bind(this);
    material.applyUniforms = function (options) {
      apply(this, options, 'uniforms');
    };
    material.applyAttributes = function (options) {
      apply(this, options, 'attributes');
    };

    return material;
  },

  apply: function (material, options, type) {

    var fields = material[type];
    _.each(options, function (value, key) {
      var field = fields[key];
      if (field) {
        if (value instanceof THREE.Color) {
          value.x = value.r;
          value.y = value.g;
          value.z = value.b;
        }
        field.value = value;
        field.needsUpdate = true;
      }
    });

    if (type == 'uniforms') {
      if (options.lineWidth !== undefined) {
        material.wireframeLinewidth = material.linewidth = options.lineWidth;
      }
      if (options.opacity !== undefined) {
        material.transparent = options.opacity < 1;
      }
    }

  },

  viewport: function (factory, absolute) {
    this.stage.viewport().shader(factory, absolute);
  }//,
};
MathBox.Ticks = function (min, max, n, scale, inclusive) {
  n = n || 10;

  // Calculate naive tick size.
  var span = max - min;
  var ideal = span / n;

  // Round to the floor'd power of ten.
  scale = scale || 1;
  var base = scale == π ? 2 : 10;
  var ref = scale * Math.pow(base, Math.floor(Math.log(ideal / scale) / Math.log(base)));

  // Make derived steps at sensible factors.
  var factors = base == π ? [1] : [5, 1, .5];
  var steps = _.map(factors, function (factor) { return ref * factor; });

  // Find step size closest to ideal.
  var step = _.reduce(steps, function (ref, step) {
    return Math.abs(step - ideal) < Math.abs(ref - ideal) ? step : ref;
  }, ref);

  // Renormalize min/max onto aligned steps.
  // Leave some room around the end for the arrow.
  var edge = +!inclusive;
  min = (Math.ceil(min / step) + edge) * step;
  max = (Math.floor(max / step) - edge) * step;
  n = Math.ceil((max - min) / step) + 1;

  var ticks = [];
  _.loop(n, function (x) {
    ticks.push(min + x * step);
  });

  return ticks;
};

MathBox.TicksLog = function (min, max, n, base, inclusive) {
  // TODO: Tick equally in log space
  // Convert fractional part into floor(log)*(1+fraction)
};/**
 * World.mathBox() – Create a mathbox-capable renderer inside a DOM element.
 */
tQuery.World.register('mathBox', function (element, options) {
  element = element || document.body;

  // Create threebox scene for WebGL
  this.threeBox(element, options);

  // Create CSS 3D overlay for labels / annotations
  var cssOverlay = new Acko.CSS3DRenderer();
  element.appendChild(cssOverlay.domElement);
  cssOverlay.domElement.style.position = 'absolute';
  cssOverlay.domElement.style.left = 0;
  cssOverlay.domElement.style.top = 0;
  cssOverlay.domElement.style.right = 0;
  cssOverlay.domElement.style.bottom = 0;

  // Auto-size overlay
  this.on('resize', function (width, height) {
    cssOverlay.setSize(width, height);
  });

  // Create mathbox stage
  var mathbox = new MathBox.Stage(options, this, cssOverlay);
  var callback = function () {
    mathbox.update();
  };
  this.tScene().add(mathbox);

  // White background
	this._renderer.setClearColorHex( 0xFFFFFF, 1 );

  // Hook into rendering loop
  mathbox.unhook = function () {
    this.loop().unhookPreRender(callback)
  }
  this.loop().hookPreRender(callback);

  if (!options.cameraControls) {
    var camera = this.tCamera();

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = options.orbit;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  return mathbox;
});

MathBox.Director = function (stage, script) {
  this._stage = stage;
  this.script = script;
  this.rollback = {};

  this.step = 0;
  this.lastCommand = 0;
};

MathBox.Director.prototype = {

  invert: function (op) {
    var stage = this._stage;

    var inverse = [];

    var verb = op[0],
        selector = op[1],
        options = op[2],
        animate = op[3],
        primitive;

    switch (verb) {
      case 'add':
        inverse.push([
          'remove',
          options.sequence || (MathBox.Primitive.sequence + 1),
        ]);
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
          var duration = animate && Math.min(300, animate.duration) || 300;
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

  apply: function (step, rollback, instant) {
    var stage = this._stage;

    _.each(step, function (op) {
      var verb = op[0] || '',
          selector = op[1] || '',
          options = op[2] || {},
          animate = op[3] || {};

      if (rollback) {
        var inverse = this.invert(op);
        var args = [0, 0].concat(inverse);
        Array.prototype.splice.apply(rollback, args);
      }

      if (instant) {
        if (animate) {
          animate = _.extend({}, animate);
          animate.delay = 0;
          animate.duration = Math.min(300, animate.duration);
        }
        if (options) {
          options = _.extend({}, options);
          options.delay = 0;
          options.duration = Math.min(300, options.duration);
        }
      }

      switch (verb) {
        case 'add':
          var primitive = stage.spawn(selector, options, animate);
          break;

        case 'remove':
          _.each(stage.select(selector), function (primitive) {
            stage.remove(primitive, options);
          });
          break;

        case 'set':
          var targets = stage.select(selector);
          var array = options.constructor == Array;
          _.each(targets, function (target, i) {
            target.set(array ? options[i] : options);
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

  go: function (step, instant) {
    if (!this.script.length) return;

    while (step < 0) step += this.script.length + 1;
    while (step >= this.script.length + 1) step -= this.script.length + 1;

    while (step > this.step) { this.forward(instant); }
    while (step < this.step) { this.back(instant); }
  },

  skipping: function () {
    var t = +new Date(), skip = false;
    if (t - this.lastCommand < 500) {
      skip = true;
    }
    this.stage().hurry('*');
    this.lastCommand = t;
    return skip;
  },

  forward: function (instant) {
    if (this.step >= this.script.length) return;

    var step = this.script[this.step];
    var rollback = this.rollback[this.step] = [];

    /*
    console.trace();
    console.profile('Director ' + this.step);
    //*/

    this.apply(step, rollback, instant || this.skipping());
    this.step++;

    /*
    setTimeout(function () {
      console.profileEnd();
    }, 500)
    //*/


    this.emit('go', this.step, 1);

    return this;
  },

  back: function (instant) {
    if (this.step <= 0) return;

    this.step--;
    this.apply(this.rollback[this.step], null, instant || this.skipping());
    delete this.rollback[this.step];

    this.emit('go', this.step, -1);

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

MathBox.Style = function (options) {
  // Apply defaults
  var defaults = this.defaults();
  options = _.extend(defaults, options || {});
  this.set(options);
};

MathBox.Style.prototype = {

  defaults: function () {
    return {
      color: new THREE.Color(0x3070F0),
      opacity: 1,
      lineWidth: 2,
      pointSize: 5,

      mathScale: new THREE.Vector3(1, 1, 1),
      mathRotation: new THREE.Vector3(),
      mathPosition: new THREE.Vector3(),

      worldScale: new THREE.Vector3(1, 1, 1),
      worldRotation: new THREE.Vector3(),
      worldPosition: new THREE.Vector3(),
      zIndex: 0.0,
    };
  },

  validateColor: function (c) {
    if (c.constructor == Array) {
      var color = new THREE.Color();
      return color.setRGB.apply(color, c);
    }
    if (c.constructor == Number) {
      return new THREE.Color(c);
    }
    if (c.constructor != THREE.Color) {
      return this.get('color');
    }
    return c;
  },

  validateMathScale: function (v) {
    if (v.constructor == Array) {
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('mathScale');
    }
    return v;
  },

  validateMathRotation: function (v) {
    if (v.constructor == Array) {
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('mathRotation');
    }
    return v;
  },

  validateMathPosition: function (v) {
    if (v.constructor == Array) {
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('mathPosition');
    }
    return v;
  },

  validateWorldScale: function (v) {
    if (v.constructor == Array) {
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('worldScale');
    }
    return v;
  },

  validateWorldRotation: function (v) {
    if (v.constructor == Array) {
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('worldRotation');
    }
    return v;
  },

  validateWorldPosition: function (v) {
    if (v.constructor == Array) {
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('worldPosition');
    }
    return v;
  },

};

MathBox.Attributes.mixin(MathBox.Style);
MathBox.CameraProxy = function (world, options) {

  this.set({
    orbit: options.orbit || 3.5,
    phi: options.phi || τ/4,
    theta: options.theta || 0,
    lookAt: [0, 0, 0],
  });

  this.singleton = 'camera';

  var controls = this.controls = world.getCameraControls()
                     || ThreeBox.OrbitControls.bind(world.tCamera(), null, this.get());

  this.on('change', function (changed) {
    _.each(changed, function (value, key) {
      if (key == 'lookAt') return;
      controls[key] = value;
    });

    if (changed.lookAt) {
      controls.lookAt.set.apply(controls.lookAt, changed.lookAt);
    }
    controls.update();
  });
  controls.update();
}

MathBox.Attributes.mixin(MathBox.CameraProxy);MathBox.Primitive = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  // Apply defaults and unpack styles
  var defaults = this.defaults();
  if (options) {
    options.style = _.extend(defaults.style, options.style || {});
    options = _.extend(defaults, options || {});
  }
  options = options || defaults;
  this.set(options);

  // Holds instantiated renderables.
  this.renders = [];

  // Holds persistent object styles
  this.style = new MathBox.Style();
  this.style.set(this.get().style || {});

  // Pass through style changes
  this.on('change', function (changed) {
    if (changed.style !== undefined) {
      this.style.set(changed.style);
    }
  }.bind(this));

  // Unique primitive sequence number.
  this.set('sequence', options.sequence || ++MathBox.Primitive.sequence);

  // Auto-assign ID.
  this.set('id', options.id || this.sequence);

  // Call init method for subclass' benefit.
  this.init();
};

MathBox.Primitive.sequence = 0;

MathBox.Primitive.types = {};

MathBox.Primitive.prototype = {
  defaults: function () {
    return {};
  },

  type: function () {
    return 'primitive';
  },

  init: function () {
  },

  make: function () {
  },

  destroy: function () {
  },

  renderables: function () {
    return [];
  },

  adjust: function (viewport) {
  }//,

};

MathBox.Attributes.mixin(MathBox.Primitive);
MicroEvent.mixin(MathBox.Primitive);
MathBox.Curve = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);
};

MathBox.Curve.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      n: 64,
      domain: [0, 1],
      data: null,
      expression: function () { return 0; },
      live: false,
      points: false,
      line: true,
      style: {}//,
    };
  },

  type: function () {
    return 'curve';
  },

  renderables: function () {
    return [ this.line, this.points ];
  },

  adjust: function (viewport) {
    var options = this.get();
    this.line.show(options.line);
    this.points.show(options.points);

    options.live && this.calculate();
  },

  make: function () {
    var that = this,
        options = this.get(),
        style = this.style,
        n = options.n;

    var vertices = this.vertices = [];

    // Allocate vertices.
    _.loop(n, function () {
      vertices.push(new THREE.Vector3());
    });

    // Instantiate renderables.
    var make = function (type) {
      return new MathBox.Renderable.Mesh(vertices, {
        type: type,
        dynamic: options.live,
      }, style);
    };

    this.line = make('line');
    this.points = make('points');

    this.calculate();
  },

  //////////

  calculate: function () {
    var vertices = this.vertices,
        options = this.get(),
        data = options.data,
        domain = options.domain,
        style = options.style,
        n = options.n;

    var x = domain[0],
        step = (domain[1] - x) / (n - 1);

    var p;
    _.loop(n, function (i) {
      if (data && (data[i] !== undefined)) {
        // Use data if available
        p = data[i];
      }
      else {
        // Use expression.
        p = options.expression.call(this, x, i);
      }

      // Allow both parametric (array) and functional (value) style.
      if (!(p instanceof Array)) p = [x, p, 0];
      p = p.concat([0, 0, 0]);

      // Update point
      vertices[i].set.apply(vertices[i], p);

      x += step;
    }.bind(this));

  }//,

});

MathBox.Primitive.types.curve = MathBox.Curve;
MathBox.Bezier = function (options) {
  MathBox.Curve.call(this, options);
};

MathBox.Bezier.prototype = _.extend(new MathBox.Curve(null), {

  defaults: function () {
    return {
      n: 64,
      domain: [0, 1],
      data: null,
      order: 3,
      expression: function () { return 0; },
      live: false,
      points: false,
      line: true,
      style: {}//,
    };
  },

  type: function () {
    return 'bezier';
  },

  //////////

  calculate: function () {
    var vertices = this.vertices,
        options = this.get(),
        domain = options.domain,
        data = options.data,
        style = options.style,
        order = options.order,
        n = options.n;

    // Verify order
    if (order < 1 || order > 3) throw "Bezier curve order must be 1, 2 or 3.";

    // Collect control points into uniform vec3 array.
    var points = [], p;
    _.loop(order + 1, function (i) {
      if (data && (data[i] !== undefined)) {
        // Use data if available
        p = data[i];
      }
      else {
        // Use expression.
        p = options.expression.call(this, i, i);
      }

      // Allow both parametric (array) and functional (value) style.
      if (!(p instanceof Array)) p = [x, p, 0];
      p = p.concat([0, 0, 0]);

      points.push(new THREE.Vector3(p[0], p[1], p[2]));
    }.bind(this));

    var uniforms = {
      bezierPoints: points,
    };

    // Write out vertices in interpolation domain.
    var x = domain[0],
        step = (domain[1] - x) / (n - 1);
    _.loop(n, function (i) {
      vertices[i].set(x, 0, 0);
      x += step;
    });

    // Apply custom position shader to renderables
    var opts = {
      uniforms: uniforms,
      shaders: {
        position: function (f, m) {
          f
            .snippet('bezier' + order)
            .snippet('mathTransform');
          m.viewport(f);
        },
      },
    };
    this.line.set(opts);
    this.points.set(opts);
  }//,

});

MathBox.Primitive.types.bezier = MathBox.Bezier;
MathBox.Axis = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);
};

MathBox.Axis.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      axis: 0,
      offset: [0, 0, 0],
      n: 2,
      ticks: 10,
      tickBase: 1,
      arrow: true,
      size: .07,
      style: {
        lineWidth: 4,
        color: new THREE.Color(0x707070)//,
      }//,
    };
  },

  renderables: function () {
    return [ this.line, this.ticks, this.arrow ];
  },

  type: function () {
    return 'axis';
  },

  adjust: function (viewport) {
    var options = this.get(),
        axis = options.axis,
        offset = options.offset,
        arrow = options.arrow,
        size = options.size,
        ticks = options.ticks,
        tickBase = options.tickBase,
        n = options.n,
        points = this.points,
        tickPoints = this.tickPoints,
        tickSigns = this.tickSigns;

    var p = [0, 0, 0],
        add = new THREE.Vector3();

    // Prepare axis extents.
    var range = viewport.axis(axis),
        min = range[0],
        max = range[1],
        inv = (max - min) / (n - 1);

    // Prepare axis offset.
    add.set.apply(add, offset);

    // Place uniformly spaced points for axis.
    _.loop(n, function (x) {
      p[axis] = min + x * inv;

      points[x].set.apply(points[x], p);
      points[x].addSelf(add);
    });

    // Show/hide arrow
    this.arrow.show(arrow);

    // Prepare tick marks range/scale.
    this.ticks.show(!!ticks);
    if (ticks) {
      var scale = MathBox.Ticks(min, max, ticks, tickBase, true);
      var limit = Math.floor(tickPoints.length / 2);
      if (scale.length > limit) scale = scale.slice(0, limit);

      // Calculate epsilon vector for finding normal
      var e = [0, 0, 0], last;
      e[axis == 2 ? 0 : (1 - axis)] = (max - min) * .01;
      this.epsilon.set.apply(this.epsilon, e);

      // Place uniformly spaced pairs of points for ticks.
      var p = [0, 0, 0], mn = 100, mx = -100;
      _.each(scale, function (x, i) {
        i = i*2;
        p[axis] = x;

        tickPoints[i].set.apply(tickPoints[i], p);
        tickPoints[i].addSelf(add);
        tickSigns[i] = 1;

        tickPoints[i+1].copy(tickPoints[i]);
        tickSigns[i+1] = -1;

        last = i + 1;
      });

      var i = last + 1, n = tickPoints.length;
      while (i < n) {
        tickPoints[i].copy(tickPoints[last]);
        tickSigns[i] = tickSigns[last];
        i++;
      }
    }
    window.ij = true;
  },

  make: function () {
    var options = this.get(),
        axis = options.axis,
        n = options.n,
        size = options.size,
        ticks = options.ticks,
        style = this.style,
        points = this.points = [],
        tickPoints = this.tickPoints = [],
        tickSigns = this.tickSigns = [],
        epsilon = this.epsilon = new THREE.Vector3();

    // Prepare arrays of vertices.
    _.loop(n, function (x) {
      points.push(new THREE.Vector3());
    });
    _.loop(ticks * 8, function (i) {
      tickPoints.push(new THREE.Vector3());
      tickSigns.push(1);
    });

    var meshOptions = { dynamic: true, type: 'line' };
    var arrowOptions = { dynamic: true, size: options.size, offset: .5 };
    var tickOptions = { dynamic: true, size: options.size * .2 };

    // Line, arrowhead and tick marks.
    this.line = new MathBox.Renderable.Mesh(points, meshOptions, style);
    this.arrow = new MathBox.Renderable.ArrowHead(points[n - 2], points[n - 1], arrowOptions, style);
    this.ticks = new MathBox.Renderable.Ticks(tickPoints, tickSigns, epsilon, tickOptions, style);
  }//,

});

MathBox.Axis.validateArgs = function (options) {
  // Alternate syntax: (axis)
  if (typeof options == 'number') {
    options = { axis: options };
  }
  return options;
};

MathBox.Primitive.types.axis = MathBox.Axis;
MathBox.Grid = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);
};

MathBox.Grid.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      axis: [ 0, 1 ],
      offset: [0, 0, 0],
      show: [ true, true ],
      n: 2,
      ticks: [ 10, 10 ],
      tickBase: [ 1, 1 ],
      style: {
        lineWidth: 1,
        color: new THREE.Color(0xA0A0A0)//,
      }//,
    };
  },

  type: function () {
    return 'grid';
  },

  renderables: function () {
    return this.lines || [];
  },

  adjust: function (viewport) {

    var options = this.get(),
        axis = options.axis,
        ticks = options.ticks,
        tickBase = options.tickBase,
        n = options.n,
        show = options.show,
        offset = options.offset,
        points = this.points,
        count = this.count,
        limit = this.limit;

    var ranges = [];

    // Symmetrical grid division
    if (typeof n == 'number') {
      n = [n, n];
    }

    // Prepare axis extents.
    _.each(axis, function (axis, i) {
      var range = viewport.axis(axis);
      ranges.push({
        axis: axis,
        min: range[0],
        max: range[1],
        inv: (range[1] - range[0]) / (n[i] - 1),
        ticks: ticks[i],
        tickBase: tickBase[i]//,
      });
    });

    // Place uniformly spaced points for each direction.
    function generate(points, a, b, limit, n) {
      var p = offset.slice(), i = 0;

      // Get ticks in main direction
      var scale = MathBox.Ticks(a.min, a.max, a.ticks, a.tickBase, true);

      // Cap scale to available lines
      if (scale.length > limit) scale = scale.slice(0, limit);

      // Create line along each tick.
      _.each(scale, function (tick) {
        p[a.axis] = tick + offset[a.axis];
        p[b.axis] = b.min + offset[b.axis];

        // N equally spaced line segments
        _.loop(n - 1, function (x) {
          points[i].set.apply(points[i], p);
          i++;

          p[b.axis] += b.inv;
          points[i].set.apply(points[i], p);
          i++;
        });
      });

      var last = Math.max(0, i - 1),
          count = points.length;
      while (i < count) {
        points[i++].copy(points[last]);
      }
    };

    this.lines[0].show(show[0]);
    this.lines[1].show(show[1]);

    show[0] && generate(points[0], ranges[1], ranges[0], limit[0], n[0]);
    show[1] && generate(points[1], ranges[0], ranges[1], limit[1], n[1]);
  },

  make: function (materials) {
    var options = this.get(),
        axis = options.axis,
        ticks = options.ticks,
        n = options.n,
        points = this.points = [[], []],
        style = this.style;

    // Symmetrical grid division
    if (typeof n == 'number') {
      n = [n, n];
    }

    // Count number of vertices necessary
    var limit = this.limit = [0, 0];

    // Prepare arrays of vertices.
    _.each(ticks, function (tick, i) {
      i = 1 - i;
      limit[i] = tick * 4;
      _.loop(limit[i] * (n[i] - 1) * 2, function (x) {
        points[i].push(new THREE.Vector3());
      });
    });

    // Line, arrowhead and tick marks.
    this.lines = [];
    this.lines.push(new MathBox.Renderable.Mesh(points[0], { type: 'line', strip: false, dynamic: true }, style));
    this.lines.push(new MathBox.Renderable.Mesh(points[1], { type: 'line', strip: false, dynamic: true }, style));
  }//,

});

MathBox.Primitive.types.grid = MathBox.Grid;
MathBox.Vector = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);

  this.render = [];
  this.vertices = null;
  this.points = null;
  this.line = null;
};

MathBox.Vector.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      n: 1,
      data: null,
      expression: function () { return 0; },
      live: false,
      style: {},
      size: .07//,
    };
  },

  type: function () {
    return 'vector';
  },

  renderables: function () {
    return this.render;
  },

  adjust: function (viewport) {
    var options = this.get();
    // Vector foreshortening requires live
    (true || options.live) && this.calculate(viewport);
  },

  make: function () {
    var that = this,
        options = this.get(),
        style = this.style,
        n = options.n;

    var vertices = this.vertices = [];
    var points = this.points = [];
    var render = this.render = [];

    var lineOptions = { dynamic: options.live, type: 'line', strip: false };
    var arrowOptions = { size: options.size };

    // Allocate vertices for line segments.
    // Allocate arrowheads.
    var i = 0;
    _.loop(n, function () {
      vertices.push(new THREE.Vector3());
      vertices.push(new THREE.Vector3());
      points.push(new THREE.Vector3());
      points.push(new THREE.Vector3());

      var arrowhead = new MathBox.Renderable.ArrowHead(points[i++], points[i++], arrowOptions, style);
      render.push(arrowhead);
    });

    this.line = new MathBox.Renderable.Mesh(vertices, lineOptions, style);
    render.push(this.line);

    this.calculate();
  },

  //////////

  calculate: function (viewport) {
    var vertices = this.vertices,
        points = this.points,
        options = this.get(),
        data = options.data,
        style = options.style,
        n = options.n,
        size = options.size;

    // Line segment foreshortening
    var fv = new THREE.Vector3(1, 1, 1);
    var diff = new THREE.Vector3();

    // Find necessary foreshortening factors so line does not stick out through the arrowhead.
    if (viewport) {
      var matrix = viewport.transform.elements;
      var fx = size/2 / Math.abs(matrix[0]);
      var fy = size/2 / Math.abs(matrix[5]);
      var fz = size/2 / Math.abs(matrix[10]);
      fv.set(fx, fy, fz);
    }

    var j = 0, k = 0;
    _.loop(n * 2, function (i) {
      if (data && (data[i] !== undefined)) {
        // Use data if available
        p = data[i];
      }
      else {
        // Use expression.
        p = options.expression.call(this, k, j);
      }

      // Allow both parametric (array) and functional (value) style.
      if (!(p instanceof Array)) p = [i, p, 0];
      p = p.concat([0, 0, 0]);

      // Update point
      points[i].set.apply(points[i], p);

      // Shorten line segment to make room for arrow
      vertices[i].set.apply(vertices[i], p);
      if (i % 2 == 1) {
        // Find foreshortening factor in vector's direction.
        diff.sub(vertices[i], vertices[i - 1]);
        diff.x = Math.abs(diff.x);
        diff.y = Math.abs(diff.y);
        diff.z = Math.abs(diff.z);
        var l = diff.lengthManhattan();
        var f = 1 - diff.dot(fv) / l / diff.length();

        // Scale vector.
        diff.sub(vertices[i], vertices[i - 1]);
        diff.multiplyScalar(f);
        vertices[i].add(vertices[i - 1], diff);
      }

      // Start/end + vector indices
      k = j ? k + 1 : k;
      j = (j+1)%2;

    }.bind(this));

  }//,

});

MathBox.Primitive.types.vector = MathBox.Vector;
MathBox.Surface = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);
};

MathBox.Surface.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      n: [ 64, 64 ],
      domain: [[0, 1], [0, 1]],
      data: null,
      expression: function () { return 0; },
      live: false,
      points: false,
      line: false,
      mesh: true,
      doubleSided: true,
      flipSided: false,
      shaded: true,
      style: {}//,
    };
  },

  type: function () {
    return 'surface';
  },

  renderables: function () {
    return [ this.mesh, this.line, this.points ];
  },

  adjust: function (viewport) {
    var options = this.get();

    this.mesh.show(options.mesh);
    this.line.show(options.line);
    this.points.show(options.points);

    options.live && this.calculate();
  },

  make: function () {
    var that = this,
        options = this.get(),
        style = this.style,
        n = options.n;

    if (typeof n == 'number') {
      n = [n, n];
    }

    // Use PlaneGeometry to allocate vertices/uvs.
    var geometry = this.geometry = new THREE.PlaneGeometry(2, 2, n[0] - 1, n[1] - 1);
    this.vertices = geometry.vertices;

    // Instantiate renderable.
    this.mesh = new MathBox.Renderable.Mesh(geometry, {
      type: 'mesh',
      doubleSided: options.doubleSided,
      flipSided: options.flipSided,
      shaded: options.shaded,
      dynamic: options.live
    }, style);
    this.line = new MathBox.Renderable.Mesh(geometry, {
      type: 'mesh',
      shaded: options.shaded,
      dynamic: options.live,
      wireframe: true
    }, style);
    this.points = new MathBox.Renderable.Mesh(geometry.vertices, {
      type: 'points',
      dynamic: options.live,
    }, style);

    this.calculate();
  },

  //////////

  calculate: function () {
    var vertices = this.vertices,
        options = this.get(),
        data = options.data,
        domain = options.domain,
        style = options.style,
        n = options.n;

    if (typeof n == 'number') {
      n = [n, n];
    }

    var x = domain[0][0],
        y = domain[1][0],
        stepX = (domain[0][1] - x) / (n[0] - 1),
        stepY = (domain[1][1] - y) / (n[1] - 1);

    var p, o = 0;
    _.loop(n[1], function (j) {
      x = domain[0][0];
      _.loop(n[0], function (i) {
        if (data && (data[j] !== undefined) && (data[j][i] !== undefined)) {
          // Use data if available
          p = data[j][i];
        }
        else {
          // Use expression.
          p = options.expression.call(this, x, y, i, j, o);
        }

        // Allow both parametric (array) and functional (value) style.
        if (!(p instanceof Array)) p = [x, p, y];
        p = p.concat([0, 0, 0]);

        // Update point
        vertices[o].set.apply(vertices[o], p);

        x += stepX;
        o++;
      }.bind(this));
      y += stepY;
    }.bind(this));

  }//,

});

MathBox.Primitive.types.surface = MathBox.Surface;
MathBox.BezierSurface = function (options) {
  this.matrixX = new THREE.Matrix4();
  this.matrixY = new THREE.Matrix4();
  this.matrixZ = new THREE.Matrix4();

  this.coefficients = new THREE.Matrix4(
    -1,  3, -3,  1,
     3, -6,  3,  0,
    -3,  3,  0,  0,
     1,  0,  0,  0//,
  );
  MathBox.Surface.call(this, options);
};

MathBox.BezierSurface.prototype = _.extend(new MathBox.Surface(null), {

  defaults: function () {
    return {
      n: [ 64, 64 ],
      domain: [[0, 1], [0, 1]],
      data: null,
      order: 3,
      expression: function () { return 0; },
      live: false,
      points: false,
      line: false,
      mesh: true,
      doubleSided: true,
      flipSided: false,
      shaded: true,
      style: {}//,
    };
  },

  type: function () {
    return 'bezierSurface';
  },

  //////////

  calculate: function () {
    var vertices = this.vertices,
        options = this.get(),
        domain = options.domain,
        data = options.data,
        style = options.style,
        order = options.order,
        n = options.n;

    if (typeof n == 'number') {
      n = [n, n];
    }

    // Verify order
    if (order != 3) throw "Bezier surface order must be 3.";

    // Collect control points into uniform vec3 array.
    var points = [], p;
    _.loop(order + 1, function (j) {
      _.loop(order + 1, function (i) {
        if (data && (data[j] !== undefined) && (data[j][i] !== undefined)) {
          // Use data if available
          p = data[i];
        }
        else {
          // Use expression.
          p = options.expression.call(this, i, j, i, j);
        }

        // Allow both parametric (array) and functional (value) style.
        if (!(p instanceof Array)) p = [i, p, j];
        p = p.concat([0, 0, 0]);

        points.push(p);
      }.bind(this));
    }.bind(this));

    // Collect control coordinates into X/Y/Z matrices.
    p = points;
    this.matrixX.set(
      p[0][0],  p[1][0],  p[2][0],  p[3][0],
      p[4][0],  p[5][0],  p[6][0],  p[7][0],
      p[8][0],  p[9][0],  p[10][0], p[11][0],
      p[12][0], p[13][0], p[14][0], p[15][0]//,
    );
    this.matrixY.set(
      p[0][1],  p[1][1],  p[2][1],  p[3][1],
      p[4][1],  p[5][1],  p[6][1],  p[7][1],
      p[8][1],  p[9][1],  p[10][1], p[11][1],
      p[12][1], p[13][1], p[14][1], p[15][1]//,
    );
    this.matrixZ.set(
      p[0][2],  p[1][2],  p[2][2],  p[3][2],
      p[4][2],  p[5][2],  p[6][2],  p[7][2],
      p[8][2],  p[9][2],  p[10][2], p[11][2],
      p[12][2], p[13][2], p[14][2], p[15][2]//,
    );

    // Apply bezier control weights for cubic polynomial
    var m0 = this.coefficients;
    this.matrixX.multiplySelf(m0).transpose().multiplySelf(m0);
    this.matrixY.multiplySelf(m0).transpose().multiplySelf(m0);
    this.matrixZ.multiplySelf(m0).transpose().multiplySelf(m0);

    var uniforms = {
      bezierSurfaceX: this.matrixX,
      bezierSurfaceY: this.matrixY,
      bezierSurfaceZ: this.matrixZ,
    };

    // Write out vertices in interpolation domain.
    var x = domain[0][0],
        y = domain[1][0],
        stepX = (domain[0][1] - x) / (n[0] - 1),
        stepY = (domain[1][1] - y) / (n[1] - 1);
    var o = 0;
    _.loop(n[1], function (j) {
      x = domain[0][0];
      _.loop(n[0], function (i) {
        vertices[o].set(x, y, 0);

        x += stepX;
        o++;
      }.bind(this));
      y += stepY;
    }.bind(this));

    // Apply custom position/fragment shader to renderable
    var opts = {
      uniforms: uniforms,
      shaders: {
        position: function (f, m) {
          f
            .snippet('bezierSurface' + order)
            .snippet('mathTransform');
          m.viewport(f);
        },
      },
    };
    this.mesh.set(opts);
    this.line.set(opts);
    this.points.set(opts);

  }//,

});

MathBox.Primitive.types.bezierSurface = MathBox.BezierSurface;
MathBox.Renderable = function (options, style) {
  // Allow inheritance constructor
  if (options === null) return;

  // Unique renderable ID.
  this.id = ++MathBox.Renderable.id;

  // Apply defaults
  var defaults = this.defaults();
  if (options) {
    options = _.extend(defaults, options || {});
  }
  options = options || defaults;
  this.set(options);

  // Wrap a three.js renderable.
  this.object = null;
  this.material = null;
  this.geometry = null;
  this.visible = true;

  // Update on style/uniforms change
  this.style = style || new MathBox.Style();
  this.style.on('change', this.styleCallback = this.refresh.bind(this));
  this.on('change', this.uniformsCallback = this.refresh.bind(this));

  // Combined user-defined math-space transform
  this.mathTransform = new THREE.Matrix4();
};

MathBox.Renderable.id = 0;

MathBox.Renderable.prototype = {
  defaults: function () {
    return {};
  },

  make: function (materials) {
  },

  destroy: function () {
  },

  show: function (show) {
    this.visible = (show === undefined ? true : !!show);
    this.refresh();
  },

  composeTransform: function (position, rotation, scale) {
		var mRotation = THREE.Matrix4.__m1;
		var mScale = THREE.Matrix4.__m2;

    mRotation.identity();
		mRotation.setRotationFromEuler(rotation, this.object.eulerOrder);

		mScale.makeScale(scale.x, scale.y, scale.z);

		this.mathTransform.multiply(mRotation, mScale);

    var te = this.mathTransform.elements;
		te[12] = position.x;
		te[13] = position.y;
		te[14] = position.z;
  },

  refresh: function () {
    var options;
    var style = this.style.get();

    if (this.object) {
      // Apply user-defined world transforms through three.js modelView matrix.
      this.object.position = style.worldPosition;
      this.object.rotation = style.worldRotation;
      this.object.scale = style.worldScale;

      // Prepare combined mathTransform matrix
      this.composeTransform(style.mathPosition, style.mathRotation, style.mathScale);

      // Set visibility
      this.object.visible = this.visible && (style.opacity > 0);

      // Set double sided / culling order.
      options = this.get();
      this.object.doubleSided = options.doubleSided;
      this.object.flipSided = options.flipSided;
    }

    if (this.material) {
      // Apply style uniforms
      this.material.applyUniforms(style);

      // Apply mathTransform
      this.material.applyUniforms({ mathTransform: this.mathTransform });

      // Apply custom uniforms
      options = this.get().uniforms;
      if (options) {
        this.material.applyUniforms(options);
      }

      // Apply custom attributes
      options = this.get().attributes;
      if (options) {
        this.material.applyAttributes(options);
      }
    }
  },

  adjust: function (viewport) {
    if (this.material) {
      this.material.applyUniforms(viewport.uniforms());
    }
  }//,

};

MathBox.Attributes.mixin(MathBox.Renderable);
MathBox.Renderable.Mesh = function (points, options, style) {
  this.points = points;

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.Mesh.prototype = _.extend(new MathBox.Renderable(null), {

  defaults: function () {
    return {
      type: 'points',
      doubleSided: true,
      dynamic: false,
      absolute: false,
      strip: true,
      shaders: {},
    };
  },

  make: function (materials) {
    var options = this.get(),
        type = options.type,
        strip = options.strip,
        shaders = options.shaders;

    // Decide on THREE renderable.
    var klass = {
      points: THREE.ParticleSystem,
      line: THREE.Line,
      mesh: THREE.Mesh//,
    }[type];
    if (!klass) throw "Invalid Mesh type '"+ type +"'";

    // Prepare material / shadergraph
    var material = this.material = materials.generic(options);

    // Prepare geometry
    var geometry, points = this.points;
    if (points instanceof Array) {
      // Default, vertices-only
      geometry = this.geometry = new THREE.Geometry();
      geometry.vertices = this.points;
    }
    else {
      // Pass through
      geometry = this.geometry = points;
    }
    geometry.dynamic = options.dynamic;

    // Prepare object3d
    var object;
    switch (type) {
      case 'line':
        object = new THREE.Line(geometry, material, strip ? THREE.LineStrip : THREE.LinePieces);
        break;
      default:
        object = new klass(geometry, material);
        break;
    }
    this.object = object;

    // Refresh material uniforms.
    this.refresh();
  },

  adjust: function (viewport) {
    if (this.get().dynamic) {
      this.geometry.verticesNeedUpdate = true;
    }
    MathBox.Renderable.prototype.adjust.call(this, viewport);
  }//,

});
MathBox.Renderable.ArrowHead = function (from, to, options, style) {
  this.from = from;
  this.to = to;

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.ArrowHead.prototype = _.extend(new MathBox.Renderable(null), {

  defaults: function () {
    return {
      offset: 0,
      absolute: true,
      size: .1//,
    };
  },

  adjust: function (viewport) {
    var options = this.get();
    var offset = options.offset;

    // Calculate arrow in world space
    var from = this._from.copy(this.from);
    var to = this._to.copy(this.to);
    viewport.to(from);
    viewport.to(to);

    // Calculate axis of arrowhead.
    var diff = this.diff.sub(from, to);
    if (diff.length() < .001) {
      this.object.visible = false;
      return;
    }
    else {
      this.object.visible = true;
    }

    diff = diff.normalize();

    // Prepare 'random' normal
    this.normal.x = this.diff.y + .1;
    this.normal.y = this.diff.z + .2;
    this.normal.z = this.diff.x + .3;
    this.normal.normalize();

    // Prepare binormal
    var bi = this.bi.cross(this.diff, this.normal);

    // Renormalize axes.
    var normal = this.normal.cross(this.diff, this.bi);

    // Prepare object matrix to place arrowhead
    var size = options.size;
    var matrix = new THREE.Matrix4(
      bi.x, diff.x, normal.x, to.x,
      bi.y, diff.y, normal.y, to.y,
      bi.z, diff.z, normal.z, to.z,
      0, 0, 0, 1//,
    )
    .scale(new THREE.Vector3(size, size, size));

    // Add arrowhead transform before object matrix
    this.object.updateMatrix();
    this.object.matrix.multiplySelf(matrix);

    // Move cone down so tip is at 0,0,0
    matrix.identity().setPosition({ x: 0, y: 0.5 - offset, z: 0 });
    this.object.matrix.multiplySelf(matrix);

    // Override object matrix
    this.object.matrixAutoUpdate = false;
    this.object.matrixWorldNeedsUpdate = true;

    MathBox.Renderable.prototype.adjust.call(this, viewport);
  },

  make: function (materials) {
    var options = this.get();

    // Make material.
    var material = this.material = materials.generic(options);

    this._from = new THREE.Vector3();
    this._to = new THREE.Vector3();

    this.diff = new THREE.Vector3();
    this.bi = new THREE.Vector3();
    this.normal = new THREE.Vector3(0, 0, 1);

    // Make cone mesh
    var geometry = this.geometry = new THREE.CylinderGeometry(.33, 0, 1, 16, 1);
    this.object = new THREE.Mesh(geometry, material);

    // Refresh material uniforms.
    this.refresh();
  }//,

});

MathBox.Renderable.Ticks = function (points, signs, epsilon, options, style) {
  this.points = points;
  this.signs = signs;
  this.epsilon = epsilon;

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.Ticks.prototype = _.extend(new MathBox.Renderable(null), {

  defaults: function () {
    return {
      dynamic: false,
      absolute: false,
      size: .1//,
    };
  },

  make: function (materials) {
    var options = this.get(),
        points = this.points,
        signs = this.signs;

    // Prepare material with custom position shader
    var materialOptions = {
      type: 'line',
      shaders: {
        position: function (f, m) {
          // Add snippet to load vertex position.
          m.position(f, options);

          // Calculate position and position + epsilon
          f.snippet('tickVertexSplit');

          // Transform positions to viewport
          f.group();
            // Transform position
            m.viewport(f);
          f.next();
            // Transform position + epsilon
            m.viewport(f);
          f.combine();

          // Transform both vectors into tick vertex
          f.snippet('tickVertexJoin');
        },
      },
    };
    var material = this.material = materials.generic(materialOptions);

    // Prepare geometry
    var geometry = this.geometry = new THREE.Geometry();
    geometry.vertices = points;

    // Prepare object3d
    var object = new THREE.Line(geometry, material, THREE.LinePieces);
    this.object = object;

    // Refresh material uniforms.
    this.refresh();
  },

  adjust: function (viewport) {
    var options = this.get();
    this.material && this.material.applyAttributes({
      tickSign: this.signs,
    });
    this.material && this.material.applyUniforms({
      tickEpsilon: this.epsilon,
      tickSize: options.size//,
    });

    if (options.dynamic) {
      this.material.attributes.tickSign.needsUpdate = true;
      this.geometry.verticesNeedUpdate = true;
    }

    MathBox.Renderable.prototype.adjust.call(this, viewport);
  }//,

});
MathBox.Viewport = function (options) {
  if (options === null) return;

  var defaults = this.defaults();
  options = _.extend(defaults, options || {});
  this.set(options);

  this.singleton = 'viewport';

  this._uniforms = {};
};

MathBox.Viewport.prototype = {

  defaults: function () {
    return {
      type: 'none',
      rotation: [0, 0, 0],
      position: [0, 0, 0],
    };
  },

  uniforms: function () {
    return this._uniforms;
  },

  axis: function (axis) {
    return [0, 1];
  },

  to: function (vector) {
  },

  from: function (vector) {
  },

  update: function (stage) {
    var options = this.get();
    _.each(['position', 'rotation'], function (key) {
      stage[key].set.apply(stage[key], options[key]);
    });
  },

  shader: function (factory) {
    factory.snippet('mathToWorld');
  },

  validateRotation: function (v) {
    if (v.constructor == Array) {
      v = v.concat([0, 0, 0]);
      return v.slice(0, 3);
    }
    return this.get('rotation');
  },

  validatePosition: function (v) {
    if (v.constructor == Array) {
      v = v.concat([0, 0, 0]);
      return v.slice(0, 3);
    }
    return this.get('position');
  },

};

MathBox.Attributes.mixin(MathBox.Viewport, "type");

MathBox.Viewport.types = {};

MathBox.Viewport.make = function (options) {
  var type = options.type;
  var klass = MathBox.Viewport.types[type]
           || MathBox.Viewport.types['cartesian']
           || MathBox.Viewport;
  return new klass(options);
};

MathBox.ViewportCartesian = function (options) {
  if (options === null) return;

  var _super = MathBox.Viewport;
  _super.call(this, options);
  this.super = _super.prototype;

  // Prepare transform matrices
  this.transform = new THREE.Matrix4();
  this.inverse = new THREE.Matrix4();

  // Prepare uniforms
  _.extend(this._uniforms, {
    viewportTransform: this.transform,
    viewportInverse: this.inverse//,
  });
};

MathBox.ViewportCartesian.prototype = _.extend(new MathBox.Viewport(null), {

  defaults: function () {
    return {
      type: 'cartesian',
      range: [[-1, 1], [-1, 1], [-1, 1]],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      position: [0, 0, 0],
    };
  },

  to: function (vector) {
    this.transform.multiplyVector3(vector);
  },

  from: function (vector) {
    this.inverse.multiplyVector3(vector);
  },

  axis: function (axis) {
    var range = this.get().range[axis],
        a = range[0],
        b = range[1],
        min = Math.min(a, b),
        max = Math.max(a, b);

    return [min, max];
  },

  update: function (stage) {
    var o = this.get(),
        r = o.range,
        s = o.scale;

    var x = r[0][0],
        y = r[1][0],
        z = r[2][0],
        dx = r[0][1] - x,
        dy = r[1][1] - y,
        dz = r[2][1] - z,
        sx = s[0],
        sy = s[1],
        sz = s[2];

    // Forward transform
    var transform = [
      2*sx/dx, 0, 0, -(2*x+dx)*sx/dx,
      0, 2*sy/dy, 0, -(2*y+dy)*sy/dy,
      0, 0, 2*sz/dz, -(2*z+dz)*sz/dz,
      0, 0, 0, 1,
    ];

    // Backward transform
    var inverse = [
      dx/(2*sx), 0, 0, (x+dx/2),
      0, dy/(2*sy), 0, (y+dy/2),
      0, 0, dz/(2*sz), (z+dz/2),
      0, 0, 0, 1,
    ];

    this.transform.set.apply(this.transform, transform);
    this.inverse.set.apply(this.inverse, inverse);

    MathBox.Viewport.prototype.update.call(this, stage);
  },

  // Attribute validators

  validateRange: function (range) {
    range = range || [];

    for (var j = 0; j < 3; ++j) {
      range[j] = range[j] || [];
      for (var i = 0; i < 2; ++i) {
        range[j][i] = range[j][i] !== undefined ? range[j][i] : (i*2-1);
      }
    }

    return range;
  },

  validateScale: function (scale) {
    scale = scale || [];

    for (var j = 0; j < 3; ++j) {
      scale[j] = scale[j] || 1;
    }

    return scale;
  }//,

});

MathBox.Attributes.mixin(MathBox.Viewport);

MathBox.Viewport.types.cartesian = MathBox.ViewportCartesian;
MathBox.ViewportPolar = function (options) {
  var _super = MathBox.ViewportCartesian;
  _super.call(this, options);
  this.super = _super.prototype;

  // Prepare uniforms
  _.extend(this._uniforms, {
    polarAlpha:  0,
    polarAspect: 1,
    polarPower:  1,
    polarFold:   1,
    polarFocus:  1//,
  });
};

MathBox.ViewportPolar.prototype = _.extend(new MathBox.ViewportCartesian(null), {

  defaults: function () {
    return {
      type: 'polar',
      range: [[-1, 1], [-1, 1], [-1, 1]],
      polar: 1,
      fold:  1,
      power: 1,
      aspect: 1,
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      position: [0, 0, 0],
    };
  },

  to: function (vector) {
    var aspect = this._uniforms.polarAspect,
        focus = this._uniforms.polarFocus,
        alpha = this._uniforms.polarAlpha,
        fold = this._uniforms.polarFold,
        power = this._uniforms.polarPower;

    // Polar power and fold
    vector.x *= fold;
    vector.y = Math.sign(vector.y) * Math.pow(Math.abs(vector.y), power);

    // Cartesian to polar
    if (alpha > 0.0001) {
      var radius = focus + vector.y * aspect,
          x = vector.x * alpha;

      vector.x = Math.sin(x) * radius;
      vector.y = (Math.cos(x) * radius - focus) / aspect;
    }

    // Apply viewport
    this.transform.multiplyVector3(vector);
  },

  from: function (vector) {
    var aspect = this._uniforms.polarAspect,
        focus = this._uniforms.polarFocus,
        alpha = this._uniforms.polarAlpha,
        fold = this._uniforms.polarFold,
        power = this._uniforms.polarPower;

    // Apply inverse viewport
    this.inverse.multiplyVector3(vector);

    // Polar to cartesian
    if (alpha > 0.0001) {
      var x = vector.x,
          y = vector.y * aspect + focus;

      var radius = Math.sqrt(x*x + y*y);
          theta = Math.atan2(y, x);

      vector.x = theta / alpha;
      vector.y = (radius - focus) / aspect;
    }

    // Inverse polar power and fold
    vector.x /= options.fold;
    vector.y = Math.sign(vector.y) * Math.pow(Math.abs(vector.y), 1 / power);
  },

  axis: function (axis) {
    var range = this.super.axis.call(this, axis);
        min = range[0],
        max = range[1],
        alpha = this._uniforms.polarAlpha,
        aspect = this._uniforms.polarAspect,
        focus = this._uniforms.polarFocus;

    // Correct Y extents during polar warp.
    if (axis == 1 && (alpha > 0)) {
      max = Math.max(Math.abs(max), Math.abs(min));
      min = Math.max(-focus / aspect, min);
    }
    return [min, max];
  },

  update: function (stage) {
    var options = this.get(),
        r = options.range,
        s = options.scale,
        alpha = options.polar,
        fold = options.fold,
        power = options.power,
        aspect = 1;

    var x = r[0][0],
        y = r[1][0],
        z = r[2][0],
        dx = r[0][1] - x,
        dy = r[1][1] - y,
        dz = r[2][1] - z,
        sx = s[0],
        sy = s[1],
        sz = s[2];

    // Adjust viewport for polar.
    var fdx = dx+(dy-dx)*alpha;
    var sdx = fdx/sx, sdy = dy/sy;
    aspect = sdx/sdy;

    // Forward transform
    var transform = [
      2*sx/fdx, 0, 0, -(2*x+dx)*sx/dx,
      0, 2*sy/dy, 0, -(2*y+dy)*sy/dy,
      0, 0, 2*sz/dz, -(2*z+dz)*sz/dz,
      0, 0, 0, 1,
    ];

    // Backward transform
    var inverse = [
      fdx/(2*sx), 0, 0, (x+dx/2),
      0, dy/(2*sy), 0, (y+dy/2),
      0, 0, dz/(2*sz), (z+dz/2),
      0, 0, 0, 1,
    ];

    // Update uniform values
    this.transform.set.apply(this.transform, transform);
    this.inverse.set.apply(this.inverse, inverse);

    this._uniforms.polarAlpha = alpha;
    this._uniforms.polarAspect = aspect;
    this._uniforms.polarFold = fold;
    this._uniforms.polarPower = power;
    this._uniforms.polarFocus = (alpha > 0) ? 1/alpha - 1 : 0;

    MathBox.Viewport.prototype.update.call(this, stage);
  },

  shader: function (factory) {
    factory
      .snippet('polarPower')
      .snippet('cartesianToPolar')
      .snippet('mathToWorld');
  },

  // Attribute validators

  validatePolar: function (polar) {
    return Math.max(0, Math.min(1, +polar || 0));
  }//,

});

MathBox.Attributes.mixin(MathBox.Viewport);

MathBox.Viewport.types.polar = MathBox.ViewportPolar;
MathBox.ViewportSphere = function (options) {
  var _super = MathBox.ViewportCartesian;
  _super.call(this, options);
  this.super = _super.prototype;

  // Prepare uniforms
  _.extend(this._uniforms, {
    sphereAlpha:  0,
    sphereAspectX: 1,
    sphereAspectY: 1,
    sphereYScale: 1,
    sphereFocus:  1//,
  });
};

MathBox.ViewportSphere.prototype = _.extend(new MathBox.ViewportCartesian(null), {

  defaults: function () {
    return {
      type: 'sphere',
      range: [[-1, 1], [-1, 1], [-1, 1]],
      sphere: 1,
      aspect: 1,
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      position: [0, 0, 0],
    };
  },

  to: function (vector) {
    var aspectX = this._uniforms.sphereAspectX,
        aspectY = this._uniforms.sphereAspectY,
        yScale = this._uniforms.sphereYScale,
        focus = this._uniforms.sphereFocus,
        alpha = this._uniforms.sphereAlpha;

    // Cartesian to spherical coords
    if (alpha > 0.0001) {
      var radius = focus + vector.z * aspectX,
          x = vector.x * alpha,
          y = vector.y * alpha / aspectY * yScale;

      var c = Math.cos(y) * radius;
      vector.x = Math.sin(x) * c;
      vector.y = Math.sin(y) * radius * aspectY;
      vector.z = (Math.cos(x) * c - focus) / aspectX;
    }

    // Apply viewport
    this.transform.multiplyVector3(vector);
  },

  from: function (vector) {
    var aspectX = this._uniforms.sphereAspectX,
        aspectY = this._uniforms.sphereAspectY,
        yScale = this._uniforms.sphereYScale,
        focus = this._uniforms.sphereFocus,
        alpha = this._uniforms.sphereAlpha;

    // Apply inverse viewport
    this.inverse.multiplyVector3(vector);

    // Spherical coords to cartesian
    if (alpha > 0.0001) {
      var x = vector.x,
          y = vector.y / aspectY,
          z = vector.z * aspectX + focus;

      var radius = Math.sqrt(x*x + y*y + z*z);
          theta = Math.atan2(y, Math.sqrt(x*x + y*y)),
          phi = Math.atan2(x, z);

      vector.x = theta / alpha;
      vector.y = phi / alpha * aspectY / yScale;
      vector.z = (radius - focus) / aspectX;
    }
  },

  axis: function (axis) {
    var range = this.super.axis.call(this, axis);
        min = range[0],
        max = range[1],
        alpha = this._uniforms.sphereAlpha,
        beta = this._uniforms.sphereBeta,
        aspectX = this._uniforms.sphereAspectX,
        aspectY = this._uniforms.sphereAspectY,
        focus = this._uniforms.sphereFocus;

    // Correct Z extents during sphere warp.
    if (axis == 2 && (alpha > 0)) {
      max = Math.max(Math.abs(max), Math.abs(min));
      min = Math.max(-focus / aspectX, min);
    }
    return [min, max];
  },

  update: function (stage) {
    var options = this.get(),
        r = options.range,
        s = options.scale,
        alpha = options.sphere,
        fold = options.fold,
        power = options.power,
        aspect = 1;

    // Focal point
    var focus = (alpha > 0) ? 1/alpha - 1 : 0;

    // Viewport extents
    var x = r[0][0],
        y = r[1][0],
        z = r[2][0],
        dx = r[0][1] - x,
        dy = r[1][1] - y,
        dz = r[2][1] - z,
        sx = s[0],
        sy = s[1],
        sz = s[2];

    // Adjust viewport for sphere.
    var fdx = dx+(dz-dx)*alpha;
    var fdy = dy+(dz-dy)*alpha;
    var sdx = fdx/sx,
        sdy = fdy/sy,
        sdz = dz/sz;
    aspectX = sdx/sdz,
    aspectY = sdy/sdz/aspectX,
    aspectZ = dy/dx*sx/sy*2,
     yScale = Math.min(aspectY / alpha, 1 + (aspectZ - 1) * alpha);

    // Forward transform
    var transform = [
      2*sx/fdx, 0, 0, -(2*x+dx)*sx/dx,
      0, 2*sy/fdy, 0, -(2*y+dy)*sy/dy,
      0, 0, 2*sz/dz, -(2*z+dz)*sz/dz,
      0, 0, 0, 1,
    ];

    // Backward transform
    var inverse = [
      fdx/(2*sx), 0, 0, (x+dx/2),
      0, fdy/(2*sy), 0, (y+dy/2),
      0, 0, dz/(2*sz), (z+dz/2),
      0, 0, 0, 1,
    ];

    // Update uniform values
    this.transform.set.apply(this.transform, transform);
    this.inverse.set.apply(this.inverse, inverse);

    this._uniforms.sphereAlpha = alpha;
    this._uniforms.sphereAspectX = aspectX;
    this._uniforms.sphereAspectY = aspectY;
    this._uniforms.sphereYScale = yScale;
    this._uniforms.sphereFocus = focus;

    MathBox.Viewport.prototype.update.call(this, stage);
  },

  shader: function (factory) {
    factory
      .snippet('cartesianToSphere')
      .snippet('mathToWorld');
  },

  // Attribute validators

  validateSphere: function (sphere) {
    return Math.max(0, Math.min(1, +sphere || 0));
  }//,

});

MathBox.Attributes.mixin(MathBox.Viewport);

MathBox.Viewport.types.sphere = MathBox.ViewportSphere;
