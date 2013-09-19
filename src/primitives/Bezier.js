/**
 * Bezier curve of order 1-3.
 */
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
      live: true,
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
      var px = 0,
          py = 0,
          pz = 0;
      if (!(p instanceof Array)) {
        px = x;
        py = +p;
      }
      else {
        var l = p.length;
        if (l > 0) px = p[0];
        if (l > 1) py = p[1];
        if (l > 2) pz = p[2];
      }

      // Update point
      points.push(new THREE.Vector3(px, py, pz));
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
