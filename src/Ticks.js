/**
 * Helper to place equally spaced ticks in a range at sensible positions.
 *
 * @param min/max - Minimum and maximum of range
 * @param n - Desired number of ticks in range
 * @param unit - Base unit of scale (e.g. 1 or π).
 * @param scale - Division scale (e.g. 2 = binary division, or 10 = decimal division).
 * @param inclusive - Whether to add ticks at the edges
 * @param bias - Integer to bias divisions one or more levels up or down (to create nested scales)
 */
MathBox.Ticks = function (min, max, n, unit, scale, inclusive, bias) {
  // Desired
  n = n || 10;
  bias = bias || 0;

  // Calculate naive tick size.
  var span = max - min;
  var ideal = span / n;

  // Round to the floor'd power of 'scale'
  unit = unit || 1;
  scale = scale || 10;
  var ref = unit * (bias + Math.pow(scale, Math.floor(Math.log(ideal / unit) / Math.log(scale))));

  // Make derived steps at sensible factors.
  var factors = ((scale % 2) == 0) ? [scale / 2, 1, .5] : [1];
  var steps = _.map(factors, function (factor) { return ref * factor; });

  // Find step size closest to ideal.
  var step = _.reduce(steps, function (ref, step) {
    return Math.abs(step - ideal) < Math.abs(ref - ideal) ? step : ref;
  }, ref);

  // Renormalize min/max onto aligned steps.
  var edge = +!inclusive;
  min = (Math.ceil(min / step) + edge) * step;
  max = (Math.floor(max / step) - edge) * step;
  n = Math.ceil((max - min) / step) + 1;

  var ticks = [];
  _.loop(n, function (x) {
    ticks.push(min + x * step);
  });

  return ticks;
};

MathBox.TicksLog = function (min, max, n, base, inclusive, bias) {
  // TODO: Tick equally in log space
  // Convert fractional part into floor(log)*(1+fraction)
};