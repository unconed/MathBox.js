/**
 * One or more vectors with given start and end points.
 */
MathBox.Vector = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);

  this.render = [];
  this.vertices = null;
  this.points = null;
  this.line = null;
};

MathBox.Vector.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      n: 1,
      data: null,
      expression: function () { return 0; },
      live: true,
      style: {},
      size: .07//,
    };
  },

  type: function () {
    return 'vector';
  },

  renderables: function () {
    return this.render;
  },

  adjust: function (viewport) {
    var options = this.get();
    // Bug: Vector foreshortening requires live to be always-on
    (true || options.live) && this.calculate(viewport);
  },

  make: function () {
    var that = this,
        options = this.get(),
        style = this.style,
        n = options.n;

    var vertices = this.vertices = [];
    var points = this.points = [];
    var render = this.render = [];

    var lineOptions = { dynamic: options.live, type: 'line', strip: false };
    var arrowOptions = { size: options.size };

    // Allocate vertices for line segments.
    // Allocate arrowheads.
    var i = 0;
    _.loop(n, function () {
      vertices.push(new THREE.Vector3());
      vertices.push(new THREE.Vector3());
      points.push(new THREE.Vector3());
      points.push(new THREE.Vector3());

      var arrowhead = new MathBox.Renderable.ArrowHead(points[i++], points[i++], arrowOptions, style);
      render.push(arrowhead);
    });

    this.line = new MathBox.Renderable.Mesh(vertices, lineOptions, style);
    render.push(this.line);

    this.calculate();
  },

  //////////

  calculate: function (viewport) {
    var vertices = this.vertices,
        points = this.points,
        options = this.get(),
        data = options.data,
        style = options.style,
        n = options.n,
        size = options.size;

    // Line segment foreshortening
    var fv = new THREE.Vector3(1, 1, 1);
    var diff = new THREE.Vector3();

    // Find necessary foreshortening factors so line does not stick out through the arrowhead.
    if (viewport) {
      var matrix = viewport.transform.elements;
      var fx = size/2 / Math.abs(matrix[0]);
      var fy = size/2 / Math.abs(matrix[5]);
      var fz = size/2 / Math.abs(matrix[10]);
      fv.set(fx, fy, fz);
    }

    var j = 0, k = 0;
    _.loop(n * 2, function (i) {
      if (data && (data[i] !== undefined)) {
        // Use data if available
        p = data[i];
      }
      else {
        // Use expression.
        p = options.expression.call(this, k, j);
      }

      // Allow both parametric (array) and functional (value) style.
      if (!(p instanceof Array)) p = [i, p, 0];
      p = p.concat([0, 0, 0]);

      // Update point
      points[i].set.apply(points[i], p);

      // Shorten line segment to make room for arrow
      vertices[i].set.apply(vertices[i], p);
      if (i % 2 == 1) {
        // Find foreshortening factor in vector's direction.
        diff.sub(vertices[i], vertices[i - 1]);
        diff.x = Math.abs(diff.x);
        diff.y = Math.abs(diff.y);
        diff.z = Math.abs(diff.z);
        var l = diff.lengthManhattan();
        var f = 1 - diff.dot(fv) / l / diff.length();

        // Scale vector.
        diff.sub(vertices[i], vertices[i - 1]);
        diff.multiplyScalar(f);
        vertices[i].add(vertices[i - 1], diff);
      }

      // Start/end + vector indices
      k = j ? k + 1 : k;
      j = (j+1)%2;

    }.bind(this));

  }//,

});

MathBox.Primitive.types.vector = MathBox.Vector;
