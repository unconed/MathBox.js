/**
 * Cartesian to polar viewport transform.
 *
 * To animate the transition, the origin of the polar coordinate grid (the focus) is moved
 * from infinity out to 0. In doing so, grid lines in the X direction bend smoothly from
 * straight lines (circles of infinite radius) into circular arcs, while grid lines in the Y
 * direction transition from being parallel (meeting at infinity) to crossing at the origin.
 *
 * The trickiest part is the correction for non-square aspect ratios. Because the scale in
 * the radial direction is entirely arbitrary, the 'circles' are actually ellipses in
 * math-space that are squished back into circles in world-space.
 */
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
    polarFocus:  1,
    polarHelix:  0,//,
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
      helix: 0,
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
        power = this._uniforms.polarPower,
        helix = this._uniforms.polarHelix;

    // Polar power and fold
    vector.x *= fold;
    vector.y = Math.sign(vector.y) * Math.pow(Math.abs(vector.y), power);

    // Cartesian to polar
    if (alpha > 0.0001) {
      var radius = focus + vector.y * aspect,
          x = vector.x * alpha;

      // Separate folds of complex plane into helix
      vector.z += vector.x * helix * alpha;

      // Apply polar warp
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
        power = this._uniforms.polarPower,
        helix = this._uniforms.polarHelix;

    // Apply inverse viewport
    this.inverse.multiplyVector3(vector);

    // Polar to cartesian
    if (alpha > 0.0001) {
      var x = vector.x,
          y = vector.y * aspect + focus;

      // Undo polar warp
      var radius = Math.sqrt(x*x + y*y);
          theta = Math.atan2(x, y);

      vector.x = theta / alpha;
      vector.y = (radius - focus) / aspect;

      // Merge separated folds of complex plane flat
      vector.z -= vector.x * helix * alpha;
    }

    // Inverse polar power and fold
    vector.x /= fold;
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
      min = Math.max(-focus / aspect + .001, min);
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
        helix = options.helix,
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

    // Watch for negative scales.
    var idx = dx > 0 ? 1 : -1;

    // Adjust viewport range for polar transform.
    // As the viewport goes polar, the X-range is interpolated to the Y-range instead,
    // creating a perfectly circular viewport.
    var ady = Math.abs(dy);
    var fdx = dx+(ady*idx-dx)*alpha;
    var sdx = fdx/sx, sdy = dy/sy;
    aspect = Math.abs(sdx/sdy);

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
    this._uniforms.polarHelix = helix;

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
  },

  validateFold: function (fold) {
    return +fold || 0;
  },

  validatePower: function (power) {
    return +power || 0;
  },

  validateHelix: function (helix) {
    return +helix || 0;
  },

});

MathBox.Attributes.mixin(MathBox.Viewport);

MathBox.Viewport.types.polar = MathBox.ViewportPolar;
