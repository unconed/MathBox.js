/**
 * Label, text labels anchored to points in 3D
 *
 * Note: uses CSS3D renderer classes, but positions overlays in 2D using the custom
 * overlay class. This avoids fuzzy text and undesirable scaling of text.
 */
MathBox.Renderable.Labels = function (points, spacer, callback, options, style) {
  this.points = points;
  this.spacer = spacer;
  this.callback = callback;

  this.sprites = [];

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.Labels.prototype = _.extend(new MathBox.Renderable(null), {

  defaults: function () {
    return {
      absolute: true,
      size: 1//,
    };
  },

  make: function (materials) {
    var options = this.get(),
        points = this.points,
        sprites = this.sprites,
        n = this.points.length;

    // Reusable vector for later.
    this._anchor = new THREE.Vector3();

    // Make parent object to hold all the labels.
    var element = document.createElement('div');
    var object = this.object = new MathBox.Sprite(element);
    element.className = 'mathbox-dummy';

    // Make sprites for all labels
    _.loop(n, function (i) {
      var element = document.createElement('div');
      var sprite = new MathBox.Sprite(element);

      element.className = 'mathbox-label';

      sprites.push(sprite);
      object.add(sprite);
    });

    // Refresh material uniforms.
    //this.refresh();
  },

  adjust: function (viewport, cameraProxy, width, height) {
    var options = this.get(),
        points = this.points,
        sprites = this.sprites,
        callback = this.callback,
        anchor = this._anchor;

    // Update labels
    _.each(sprites, function (sprite, i) {
      // Transform anchor point
      sprite.position.copy(points[i]);
      viewport.to(sprite.position);

      // Set content
      var text = callback && callback(i) || '';
      if (sprite.element.innerHTML != text) {
        sprite.element.innerHTML = text;
      }
    });

    MathBox.Renderable.prototype.adjust.call(this, viewport);
  },


});

