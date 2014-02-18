/**
 * Cartesian to spherical viewport transform.
 *
 * To animate the transition, the origin of the spherical coordinate grid (the focus) is moved
 * from infinity out to 0. In doing so, grid lines in the X/Y direction bend smoothly from
 * straight lines (circles of infinite radius) into circular arcs, while grid lines in the Z
 * direction transition from being parallel (meeting at infinity) to crossing at the origin.
 *
 * Like the polar viewport, aspect ratio correction is paramount to making this look good.
 * In the X/Z plane, the transform matches the Polar viewport transform.
 * In the Y direction, additional aspect ratio corrections are required.
 */
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

      var radius = Math.sqrt(x*x + y*y + z*z),
          phi = Math.atan2(y, Math.sqrt(x*x + z*z)),
          theta = Math.atan2(x, z);
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

    // Watch for negative scales.
    var idx = dx > 0 ? 1 : -1;
    var idy = dy > 0 ? 1 : -1;

    // Adjust viewport for sphere.
    // As the viewport goes spherical, the X/Y-ranges are interpolated to the Z-range,
    // creating a perfectly spherical viewport.
    var adz = Math.abs(dz);
    var fdx = dx+(adz*idx-dx)*alpha;
    var fdy = dy+(adz*idy-dy)*alpha;
    var sdx = fdx/sx,
        sdy = fdy/sy,
        sdz = dz/sz;
    aspectX = sdx/sdz, // First fix X aspect to match Z
    aspectY = sdy/sdz/aspectX, // Then fix Y aspect

    // Scale Y coordinates before transforming, but cap at aspectY/alpha to prevent from poking through the poles mid-transform.
    aspectZ = dy/dx*sx/sy*2, // Factor of 2 due to the fact that in the Y direction we only go 180º from pole to pole.
    // This makes more sense if you look at how the vertex shader is implemented.
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
