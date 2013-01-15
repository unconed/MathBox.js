/**
 * 2D grid of lines, based on tickmarks.
 */
MathBox.Grid = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  MathBox.Primitive.call(this, options);
};

MathBox.Grid.prototype = _.extend(new MathBox.Primitive(null), {

  defaults: function () {
    return {
      axis: [ 0, 1 ],
      offset: [0, 0, 0],
      show: [ true, true ],
      n: 2,
      ticks: [ 10, 10 ],
      tickUnit: [ 1, 1 ],
      tickScale: [ 10, 10 ],
      style: {
        lineWidth: 1,
        color: new THREE.Color(0xA0A0A0)//,
      }//,
    };
  },

  type: function () {
    return 'grid';
  },

  renderables: function () {
    return this.lines || [];
  },

  adjust: function (viewport) {

    var options = this.get(),
        axis = options.axis,
        ticks = options.ticks,
        tickUnit = options.tickUnit,
        tickScale = options.tickScale,
        n = options.n,
        show = options.show,
        offset = options.offset,
        points = this.points,
        count = this.count,
        limit = this.limit;

    var ranges = [];

    // Symmetrical grid division
    if (typeof n == 'number') {
      n = [n, n];
    }

    // Prepare axis extents.
    _.each(axis, function (axis, i) {
      var range = viewport.axis(axis);
      ranges.push({
        axis: axis,
        min: range[0],
        max: range[1],
        inv: (range[1] - range[0]) / (n[i] - 1),
        ticks: ticks[i],
        tickUnit: tickUnit[i],
        tickScale: tickScale[i],
      });
    });

    // Place uniformly spaced points for each direction.
    function generate(points, a, b, limit, n) {
      var p = offset.slice(), i = 0;

      // Get ticks in main direction
      var scale = MathBox.Ticks(a.min, a.max, a.ticks, a.tickUnit, a.tickScale, true);

      // Cap scale to available lines
      if (scale.length > limit) scale = scale.slice(0, limit);

      // Create line along each tick.
      _.each(scale, function (tick) {
        p[a.axis] = tick + offset[a.axis];
        p[b.axis] = b.min + offset[b.axis];

        // N equally spaced line segments
        _.loop(n - 1, function (x) {
          points[i].set.apply(points[i], p);
          i++;

          p[b.axis] += b.inv;
          points[i].set.apply(points[i], p);
          i++;
        });
      });

      var last = Math.max(0, i - 1),
          count = points.length;
      while (i < count) {
        points[i++].copy(points[last]);
      }
    };

    this.lines[0].show(show[0]);
    this.lines[1].show(show[1]);

    show[0] && generate(points[0], ranges[1], ranges[0], limit[0], n[0]);
    show[1] && generate(points[1], ranges[0], ranges[1], limit[1], n[1]);
  },

  make: function (materials) {
    var options = this.get(),
        axis = options.axis,
        ticks = options.ticks,
        n = options.n,
        points = this.points = [[], []],
        style = this.style;

    // Symmetrical grid division
    if (typeof n == 'number') {
      n = [n, n];
    }

    // Count number of vertices necessary
    var limit = this.limit = [0, 0];

    // Prepare arrays of vertices.
    _.each(ticks, function (tick, i) {
      i = 1 - i;
      limit[i] = tick * 4;
      _.loop(limit[i] * (n[i] - 1) * 2, function (x) {
        points[i].push(new THREE.Vector3());
      });
    });

    // Line, arrowhead and tick marks.
    this.lines = [];
    this.lines.push(new MathBox.Renderable.Mesh(points[0], { type: 'line', strip: false, dynamic: true }, style));
    this.lines.push(new MathBox.Renderable.Mesh(points[1], { type: 'line', strip: false, dynamic: true }, style));
  }//,

});

MathBox.Primitive.types.grid = MathBox.Grid;
