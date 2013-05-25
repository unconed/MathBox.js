/**
 * Projective viewport, i.e. with a 4x4 projective transform applied
 */
MathBox.ViewportProjective = function (options) {
  var _super = MathBox.ViewportCartesian;
  _super.call(this, options);
  this.super = _super.prototype;

  // Prepare uniforms
  _.extend(this._uniforms, {
    projectiveTransform: new THREE.Matrix4(),
    projectiveInverse: new THREE.Matrix4(),
  });
};

MathBox.ViewportProjective.prototype = _.extend(new MathBox.ViewportCartesian(null), {

  defaults: function () {
    return {
      type: 'projective',
      range: [[-1, 1], [-1, 1], [-1, 1]],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      position: [0, 0, 0],
      projective: [[1, 0, 0, 0],
                   [0, 1, 0, 0],
                   [0, 0, 1, 0],
                   [0, 0, 0, 1]],
    };
  },

  to: function (vector) {
    // Apply projective transform
    this._uniforms.projectiveTransform.multiplyVector3(vector);

    // Apply viewport
    this.transform.multiplyVector3(vector);
  },

  from: function (vector) {
    // Apply inverse viewport
    this.inverse.multiplyVector3(vector);

    // Apply inverse projective transform
    this._uniforms.projectiveInverse.multiplyVector3(vector);
  },

  update: function (stage) {
    var t = this._uniforms.projectiveTransform;
    var m = this.get('projective');
    t.set.apply(t, m[0].concat(m[1], m[2], m[3]));

    this._uniforms.projectiveInverse.getInverse(t);

    MathBox.ViewportCartesian.prototype.update.call(this, stage);
  },

  shader: function (factory) {
    factory
      .snippet('projectiveTransform')
      .snippet('mathToWorld');
  },

  // Attribute validators

  validateProjective: function (m) {
    if (m.constructor == Array) {
      for (var j = 0; j < 3; ++j) {
        m[j] = (m[j] && m.constructor == Array && m[j]) || [];
        m[j] = m[j].concat([0, 0, 0, 0]).slice(0, 4);
      }
      return m;
    }
  },

});

MathBox.Attributes.mixin(MathBox.Viewport);

MathBox.Viewport.types.projective = MathBox.ViewportProjective;
