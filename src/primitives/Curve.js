/**
 * Generic curve, parametric or functional.
 */
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
      pointLabels: false,
      pointLabelTexts: null,
      distance: 15,
      expression: function () { return 0; },
      live: true,
      points: false,
      line: true,
      style: {}//,
    };
  },

  type: function () {
    return 'curve';
  },

  renderables: function () {
    return [ this.line, this.points, this.pointlabels ];
  },

  adjust: function (viewport) {
    var options = this.get();
    this.line.show(options.line);
    this.points.show(options.points);
    this.pointlabels.show(options.pointlabels);

    var visible = (options.line || options.points) || options.pointlabels && this.style.get('opacity') > 0;
    visible && options.live && this.calculate();
  },

  make: function () {
    var that = this,
        options = this.get(),
        style = this.style,
        n = options.n,
        distance = options.distance,
        pointLabels = options.pointLabels,
        pointLabelTexts = options.pointLabelTexts,
        vertices = this.vertices = [],
        pointLabelTextArray = this.pointLabelTextArray = [],
        labelTangent = this.labelTangent = new THREE.Vector3(); // Orientation for points and labels

    // Allocate vertices.
    _.loop(n, function (i) {
      vertices.push(new THREE.Vector3());
      pointLabelTextArray.push(new String);
    });

    _.loop(n, function (i) {
      l = pointLabelTexts[i];
      pointLabelTextArray[i] = l;
    });

    // Prepare primitives
    var labelOptions = { dynamic: true, distance: distance };

    // Instantiate renderables.
    var make = function (type) {
      return new MathBox.Renderable.Mesh(vertices, {
        type: type,
        dynamic: options.live,
      }, style);
    };

    // Axis vector direction for labels
    p = [0, 0, 0];
    labelTangent.set.apply(labelTangent, p);
    
    this.pointlabels = new MathBox.Renderable.PointLabels(vertices, pointLabelTextArray, labelTangent, labelOptions, style);

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
      vertices[i].set(px, py, pz);

      x += step;
    }.bind(this));

  }//,

});

MathBox.Primitive.types.curve = MathBox.Curve;
