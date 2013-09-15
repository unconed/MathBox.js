/**
 * Axis with arrowhead and tick markers.
 */
MathBox.Axis = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);

  this.on('change', function (changed) {
    if (changed.size !== undefined) {
      this.arrow && this.arrow.set('size', changed.size);
    }
  });
};

MathBox.Axis.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      axis: 0,
      offset: [0, 0, 0],
      n: 2,
      arrow: true,
      line: true,
      labels: false,

      decimals: 2,
      distance: 15,
      ticks: 10,
      tickUnit: 1,
      tickScale: 10,
      size: .07,
      style: {
        lineWidth: 4,
        color: new THREE.Color(0x707070),
      },
      formatter: null,
      zero: true,
    };
  },

  renderables: function () {
    return [ this.line, this.ticks, this.arrow, this.labels ];
  },

  type: function () {
    return 'axis';
  },

  adjust: function (viewport, camera) {
    var options = this.get(),
        axis = options.axis,
        offset = options.offset,

        arrow = options.arrow,
        line = options.line,
        labels = options.labels,

        n = options.n,
        size = options.size,

        ticks = options.ticks,
        tickUnit = options.tickUnit,
        tickScale = options.tickScale,
        decimals = options.decimals,

        points = this.points,
        labelPoints = this.labelPoints,
        labelTangent = this.labelTangent,
        tickPoints = this.tickPoints,
        tickSigns = this.tickSigns;

    var p = [0, 0, 0],
        add = new THREE.Vector3(),
        four = new THREE.Vector4();

    // Prepare axis extents.
    var range = viewport.axis(axis),
        min = range[0],
        max = range[1],
        inv = (max - min) / (n - 1);

    // Prepare axis offset.
    add.set.apply(add, offset);

    // Place uniformly spaced points for axis.
    _.loop(n, function (x) {
      p[axis] = min + x * inv;

      points[x].set.apply(points[x], p);
      points[x].addSelf(add);
    });

    // Show/hide line
    this.line.show(line);

    // Show/hide arrow
    this.arrow.show(arrow);

    // Prepare scale divisions
    var scale = this.scale = MathBox.Ticks(min, max, ticks, tickUnit, tickScale, true);

    // Prepare tick marks range/scale.
    this.ticks.show(!!ticks);
    if (ticks) {
      var limit = Math.floor(tickPoints.length / 2);
      if (scale.length > limit) scale = scale.slice(0, limit);

      // Calculate epsilon vector for finding normal
      var e = [0, 0, 0], last;
      e[axis == 2 ? 0 : (1 - axis)] = (max - min) * .01;
      this.epsilon.set.apply(this.epsilon, e);

      // Place uniformly spaced pairs of points for ticks.
      var p = [0, 0, 0], mn = 100, mx = -100;
      _.each(scale, function (x, i) {
        p[axis] = x;

        // Tick points for ticks (2 each)
        var j = i*2;
        tickPoints[j].set.apply(tickPoints[j], p);
        tickPoints[j].addSelf(add);
        tickSigns[j] = 1;

        tickPoints[j+1].copy(tickPoints[j]);
        tickSigns[j+1] = -1;

        // Anchor points for label
        labelPoints[i].copy(tickPoints[j]);

        last = j + 1;
      });

      // Fill remaining vertices with last point
      var i = last + 1, n = tickPoints.length;
      while (i < n) {
        tickPoints[i].copy(tickPoints[last]);
        tickSigns[i] = tickSigns[last];
        i++;
      }
    }

    // Axis vector direction for labels
    p = [0, 0, 0];
    p[axis] = 1;
    labelTangent.set.apply(labelTangent, p);
    this.labels.show(!!labels);

    // Label formatting
    this.labels.set('decimals', decimals);
  },

  make: function () {
    var options = this.get(),
        axis = options.axis,
        n = options.n,
        size = options.size,
        ticks = options.ticks,
        distance = options.distance,
        formatter = options.formatter,
        style = this.style,
        points = this.points = [], // Points for drawing lines
        labelPoints = this.labelPoints = [], // Points for attaching labels
        labelTangent = this.labelTangent = new THREE.Vector3(), // Orientation for points and labels
        tickPoints = this.tickPoints = [], // Points for drawing ticks (doubled)
        tickSigns = this.tickSigns = [], // Alternating signs for tick shader
        epsilon = this.epsilon = new THREE.Vector3();

    // Prepare arrays of vertices.
    _.loop(n, function (x) {
      points.push(new THREE.Vector3());
    });
    _.loop(ticks * 4, function (i) {
      labelPoints.push(new THREE.Vector3());
    });
    _.loop(ticks * 8, function (i) {
      tickPoints.push(new THREE.Vector3());
      tickSigns.push(1);
    });

    // Prepare primitives
    var meshOptions = { dynamic: true, type: 'line' };
    var arrowOptions = { dynamic: true, size: size, offset: .5 };
    var tickOptions = { dynamic: true, size: size * .2 };
    var labelOptions = { dynamic: true, distance: distance };

    // Scale label callback
    var callback = function (i) {
      var x = this.scale[i];
      if (x == 0 && !options.zero) return '';
      return formatter ? formatter(x) : x;
    }.bind(this);

    // Line, arrowhead, tick marks and labels.
    this.line = new MathBox.Renderable.Mesh(points, meshOptions, style);
    this.arrow = new MathBox.Renderable.ArrowHead(points[n - 2], points[n - 1], arrowOptions, style);
    this.ticks = new MathBox.Renderable.Ticks(tickPoints, tickSigns, epsilon, tickOptions, style);
    this.labels = new MathBox.Renderable.Labels(labelPoints, labelTangent, callback, labelOptions, style);
  },

});

MathBox.Axis.validateArgs = function (options) {
  // Alternate syntax: (axis)
  if (typeof options == 'number') {
    options = { axis: options };
  }
  return options;
};

MathBox.Primitive.types.axis = MathBox.Axis;
