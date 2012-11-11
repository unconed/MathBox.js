MathBox.Curve = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);
};

MathBox.Curve.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      n: 64,
      domain: [0, 1],
      data: null,
      expression: function () { return 0; },
      live: false,
      points: false,
      line: true,
      style: {}//,
    };
  },

  type: function () {
    return 'curve';
  },

  renderables: function () {
    return [ this.line, this.points ];
  },

  adjust: function (viewport) {
    var options = this.get();
    this.line.show(options.line);
    this.points.show(options.points);

    options.live && this.calculate();
  },

  make: function () {
    var that = this,
        options = this.get(),
        style = this.style,
        n = options.n;

    var vertices = this.vertices = [];

    // Allocate vertices.
    _.loop(n, function () {
      vertices.push(new THREE.Vector3());
    });

    // Instantiate renderables.
    var make = function (type) {
      return new MathBox.Renderable.Mesh(vertices, {
        type: type,
        dynamic: options.live,
      }, style);
    };

    this.line = make('line');
    this.points = make('points');

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

    var x = domain[0],
        step = (domain[1] - x) / (n - 1);

    var p;
    _.loop(n, function (i) {
      if (data && (data[i] !== undefined)) {
        // Use data if available
        p = data[i];
      }
      else {
        // Use expression.
        p = options.expression.call(this, x, i);
      }

      // Allow both parametric (array) and functional (value) style.
      if (!(p instanceof Array)) p = [x, p, 0];
      p = p.concat([0, 0, 0]);

      // Update point
      vertices[i].set.apply(vertices[i], p);

      x += step;
    }.bind(this));

  }//,

});

MathBox.Primitive.types.curve = MathBox.Curve;
