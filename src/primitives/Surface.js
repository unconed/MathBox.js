/**
 * Generic surface, parametric or functional.
 */
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

    var visible = (options.mesh || options.line || options.points) && this.style.get('opacity') > 0;
    visible && options.live && this.calculate();
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
      smooth: true,
      dynamic: options.live,
    }, style);
    this.line = new MathBox.Renderable.Mesh(geometry, {
      type: 'mesh',
      shaded: options.shaded,
      smooth: true,
      dynamic: options.live,
      wireframe: true
    }, style);
    this.points = new MathBox.Renderable.Mesh(geometry.vertices, {
      type: 'points',
      dynamic: options.live,
    }, style);

    // Prepare tangent arrays for shading
    if (options.shaded) {
      var tangents = this.tangents = [[], []];
      _.loop(n[0] * n[1], function () {
        tangents[0].push(new THREE.Vector3());
        tangents[1].push(new THREE.Vector3());
      });
    }

    this.calculate();
  },

  //////////

  calculate: function () {
    var vertices = this.vertices,
        tangents = this.tangents,
        options = this.get(),
        data = options.data,
        domain = options.domain,
        style = options.style,
        n = options.n,
        shaded = options.shaded,
        flipSided = options.flipSided;

    var iu = flipSided ? 1 : 0,
        iv = flipSided ? 0 : 1;

    if (typeof n == 'number') {
      n = [n, n];
    }

    var x = domain[0][0],
        y = domain[1][0],
        stepX = (domain[0][1] - x) / (n[0] - 1),
        stepY = (domain[1][1] - y) / (n[1] - 1);

    // Calculate positions of vertices
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
        var px = 0,
            py = 0,
            pz = 0;
        if (!(p instanceof Array)) {
          px = x;
          py = +p;
          pz = y;
        }
        else {
          var l = p.length;
          if (l > 0) px = p[0];
          if (l > 1) py = p[1];
          if (l > 2) pz = p[2];
        }

        // Update point
        vertices[o].set(px, py, pz);

        x += stepX;
        o++;
      }.bind(this));
      y += stepY;
    }.bind(this));

    // Calculate tangents for shading correctly after warping transforms
    if (options.shaded) {
      o = 0;
      y = domain[1][0];

      var stride = n[0],
          epsilon = 0.01;

      _.loop(n[1], function (j) {
        x = domain[0][0];

        var up = j ? j - 1 : 0,
            down = Math.min(n[1] - 1, j + 1);

        _.loop(n[0], function (i) {

          var left = i ? i - 1 : 0,
              right = Math.min(n[0] - 1, i + 1);

          // Central differences
          var v = vertices[i + j * stride];

          /* high quality */
          /*
          tangents[0][o].sub(vertices[right + j * stride], vertices[left + j * stride]).multiplyScalar(epsilon).addSelf(v);
          tangents[1][o].sub(vertices[i + down * stride], vertices[i + up * stride]).multiplyScalar(epsilon).addSelf(v);
          */

          /* low quality */
          if (right == i) {
            tangents[0][o].sub(v, vertices[left + j * stride]).addSelf(v);
          }
          else {
            tangents[0][o].copy(vertices[right + j * stride]);
          }

          if (down == j) {
            tangents[1][o].sub(v, vertices[i + up * stride]).addSelf(v);
          }
          else {
            tangents[1][o].copy(vertices[i + down * stride]);
          }

          x += stepX;
          o++;
        });
        y += stepY;
      });

      this.line.set('attributes', {
        positionDU: tangents[iu],
        positionDV: tangents[iv],
      });
      this.mesh.set('attributes', {
        positionDU: tangents[iu],
        positionDV: tangents[iv],
      });
    }

  }//,

});

MathBox.Primitive.types.surface = MathBox.Surface;
