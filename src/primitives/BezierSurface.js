/**
 * Bezier surface of order 3.
 */
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
      live: true,
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
        shaded = options.shaded,
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
          p = data[j][i];
        }
        else {
          // Use expression.
          p = options.expression.call(this, i, j, i, j);
        }

        // Allow both parametric (array) and functional (value) style.
        var px = 0,
            py = 0,
            pz = 0;
        if (!(p instanceof Array)) {
          px = i;
          py = +p;
          pz = j;
        }
        else {
          var l = p.length;
          if (l > 0) px = p[0];
          if (l > 1) py = p[1];
          if (l > 2) pz = p[2];
        }

        points.push([px, py, pz]);
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
          if (shaded) {
            f.snippet('bezierSurface' + order)

            // Transform position + DU/DV
            f.group()
              f.snippet('mathTransform');
              m.viewport(f);
            f.next();
              f.snippet('mathTransform');
              m.viewport(f);
            f.next();
              f.snippet('mathTransform');
              m.viewport(f);
            f.combine();
          }
          else {
            // Transform just position
            f
              .snippet('bezierSurface' + order)
              .snippet('mathTransform');
            m.viewport(f);
          }
        },
      },
    };
    this.mesh.set(opts);
    this.line.set(opts);
    this.points.set(opts);

  }//,

});

MathBox.Primitive.types.bezierSurface = MathBox.BezierSurface;
