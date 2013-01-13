/**
 * Platonic solid
 * (only cubes for now, need to figure clean way to build three.js extras in)
 */
MathBox.Platonic = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);
};

MathBox.Platonic.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      n: 1,
      type: 'cube',
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
    return 'platonic';
  },

  renderables: function () {
    return [ this.mesh, this.line, this.points ];
  },

  adjust: function (viewport) {
    var options = this.get();

    this.mesh.show(options.mesh);
    this.line.show(options.line);
    this.points.show(options.points);
  },

  make: function () {
    var that = this,
        options = this.get(),
        style = this.style,
        n = options.n,
        type = options.type;

    var geometry;
    switch (type) {
      case 'cube':
        geometry = new THREE.CubeGeometry(2, 2, 2, 1, 1, 1);
        break;
    }

    // Instantiate renderable.
    this.mesh = new MathBox.Renderable.Mesh(geometry, {
      type: 'mesh',
      doubleSided: options.doubleSided,
      flipSided: options.flipSided,
      shaded: options.shaded,
      smooth: false,
      dynamic: options.live,
    }, style);
    this.line = new MathBox.Renderable.Mesh(geometry, {
      type: 'mesh',
      shaded: options.shaded,
      smooth: false,
      dynamic: options.live,
      wireframe: true
    }, style);
    this.points = new MathBox.Renderable.Mesh(geometry.vertices, {
      type: 'points',
      dynamic: options.live,
    }, style);

  }//,

});

MathBox.Primitive.types.platonic = MathBox.Platonic;
