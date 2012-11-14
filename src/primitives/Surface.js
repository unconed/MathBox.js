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
