/**
 * Axis with arrowhead and tick markers.
 */
MathBox.Axis = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);
};

MathBox.Axis.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      axis: 0,
      offset: [0, 0, 0],
      n: 2,
      ticks: 10,
      tickBase: 1,
      arrow: true,
      size: .07,
      style: {
        lineWidth: 4,
        color: new THREE.Color(0x707070)//,
      }//,
    };
  },

  renderables: function () {
    return [ this.line, this.ticks, this.arrow ];
  },

  type: function () {
    return 'axis';
  },

  adjust: function (viewport) {
    var options = this.get(),
        axis = options.axis,
        offset = options.offset,
        arrow = options.arrow,
        size = options.size,
        ticks = options.ticks,
        tickBase = options.tickBase,
        n = options.n,
        points = this.points,
        tickPoints = this.tickPoints,
        tickSigns = this.tickSigns;

    var p = [0, 0, 0],
        add = new THREE.Vector3();

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

    // Show/hide arrow
    this.arrow.show(arrow);

    // Prepare tick marks range/scale.
    this.ticks.show(!!ticks);
    if (ticks) {
      var scale = MathBox.Ticks(min, max, ticks, tickBase, true);
      var limit = Math.floor(tickPoints.length / 2);
      if (scale.length > limit) scale = scale.slice(0, limit);

      // Calculate epsilon vector for finding normal
      var e = [0, 0, 0], last;
      e[axis == 2 ? 0 : (1 - axis)] = (max - min) * .01;
      this.epsilon.set.apply(this.epsilon, e);

      // Place uniformly spaced pairs of points for ticks.
      var p = [0, 0, 0], mn = 100, mx = -100;
      _.each(scale, function (x, i) {
        i = i*2;
        p[axis] = x;

        tickPoints[i].set.apply(tickPoints[i], p);
        tickPoints[i].addSelf(add);
        tickSigns[i] = 1;

        tickPoints[i+1].copy(tickPoints[i]);
        tickSigns[i+1] = -1;

        last = i + 1;
      });

      var i = last + 1, n = tickPoints.length;
      while (i < n) {
        tickPoints[i].copy(tickPoints[last]);
        tickSigns[i] = tickSigns[last];
        i++;
      }
    }
    window.ij = true;
  },

  make: function () {
    var options = this.get(),
        axis = options.axis,
        n = options.n,
        size = options.size,
        ticks = options.ticks,
        style = this.style,
        points = this.points = [],
        tickPoints = this.tickPoints = [],
        tickSigns = this.tickSigns = [],
        epsilon = this.epsilon = new THREE.Vector3();

    // Prepare arrays of vertices.
    _.loop(n, function (x) {
      points.push(new THREE.Vector3());
    });
    _.loop(ticks * 8, function (i) {
      tickPoints.push(new THREE.Vector3());
      tickSigns.push(1);
    });

    var meshOptions = { dynamic: true, type: 'line' };
    var arrowOptions = { dynamic: true, size: options.size, offset: .5 };
    var tickOptions = { dynamic: true, size: options.size * .2 };

    // Line, arrowhead and tick marks.
    this.line = new MathBox.Renderable.Mesh(points, meshOptions, style);
    this.arrow = new MathBox.Renderable.ArrowHead(points[n - 2], points[n - 1], arrowOptions, style);
    this.ticks = new MathBox.Renderable.Ticks(tickPoints, tickSigns, epsilon, tickOptions, style);
  }//,

});

MathBox.Axis.validateArgs = function (options) {
  // Alternate syntax: (axis)
  if (typeof options == 'number') {
    options = { axis: options };
  }
  return options;
};

MathBox.Primitive.types.axis = MathBox.Axis;
