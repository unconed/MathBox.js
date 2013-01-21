/**
 * One or more vectors with given start and end points.
 */
MathBox.Vector = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);

  this.render = [];
  this.arrows = [];
  this.vertices = null;
  this.points = null;
  this.line = null;

  this.on('change', function (changed) {
    if (changed.size !== undefined) {
      _.each(this.arrows, function (arrow) {
        arrow.set('size', changed.size);
      });
    }
  });
};

MathBox.Vector.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      n: 1,
      data: null,
      arrow: true,
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
    _.each(this.arrows, function (arrow) {
      arrow.show(options.arrow);
    });
  },

  make: function () {
    var that = this,
        options = this.get(),
        arrow = options.arrow,
        style = this.style,
        n = options.n;

    var vertices = this.vertices = [];
    var points = this.points = [];
    var render = this.render = [];
    var arrows = this.arrows = [];

    var lineOptions = { dynamic: options.live, type: 'line', strip: false };
    var arrowOptions = { size: options.size };

    // Allocate vertices for line segments.
    // Allocate arrowheads if arrows requested.
    var i = 0;
    _.loop(n, function () {
      vertices.push(new THREE.Vector3());
      vertices.push(new THREE.Vector3());
      points.push(new THREE.Vector3());
      points.push(new THREE.Vector3());

      if (arrow) { // arrows are expensive for now, only allocate if requested on creation
        var arrowhead = new MathBox.Renderable.ArrowHead(points[i++], points[i++], arrowOptions, style);
        render.push(arrowhead);
        arrows.push(arrowhead);
      }
    });

    this.line = new MathBox.Renderable.Mesh(vertices, lineOptions, style);
    render.push(this.line);

    this.calculate();
  },

  //////////

  calculate: function (viewport) {
    var vertices = this.vertices,
        arrows = this.arrows,
        points = this.points,
        options = this.get(),
        data = options.data,
        arrow = options.arrow,
        n = options.n,
        size = options.size,
        scale = this.style.get('mathScale');

    // Find necessary foreshortening factors so line does not stick out through the arrowhead.
    var last = new THREE.Vector3(),
        current = new THREE.Vector3();

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
      if (viewport && arrow && (i % 2 == 1)) {
        // Find vector's world-space length
        current.copy(vertices[i]);
        last.copy(vertices[i-1]);
        viewport.to(current);
        viewport.to(last);
        current.subSelf(last).multiplySelf(scale);

        var l = current.length();

        var clipped = Math.min(1, l * .5 / size);
        clipped = (1 - (1 - clipped) * (1 - clipped)) * size;

        // Foreshorten line
        var f = l - clipped;
        current.normalize().multiplyScalar(f).divideSelf(scale).addSelf(last);

        // Transform back
        viewport.from(current);
        vertices[i].copy(current);

        // Set arrowhead size
        arrows[k].set({ size: clipped });
      }

      // Start/end + vector indices
      k = j ? k + 1 : k;
      j = (j+1)%2;

    }.bind(this));

  }//,

});

MathBox.Primitive.types.vector = MathBox.Vector;
