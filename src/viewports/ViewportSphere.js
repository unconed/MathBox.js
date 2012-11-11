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
