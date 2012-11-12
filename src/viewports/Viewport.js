/**
 * Generic viewport base class
 */
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

