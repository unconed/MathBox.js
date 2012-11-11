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
