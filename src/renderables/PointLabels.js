/**
 * Point Labels, text labels anchored to points in 3D (adapted from Labels by jakemoves)
 *
 * Note: uses CSS3D renderer classes, but positions overlays in 2D using the custom
 * overlay class. This avoids fuzzy text and undesirable scaling of text.
 */
MathBox.Renderable.PointLabels = function (points, labels, tangent, options, style) {
  this.points = points;
  this.labels = labels;
  this.tangent = tangent;

  this.sprites = [];

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.PointLabels.prototype = _.extend(new MathBox.Renderable(null), {

  defaults: function () {
    return {
      absolute: true,
      distance: 15,
      size: 1//,
    };
  },

  make: function (materials) {
    var options = this.get(),
        points = this.points,
        labels = this.labels,
        tangent = this.tangent,
        sprites = this.sprites,
        n = this.points.length;

    // Reusable vector for later.
    this._anchor = new THREE.Vector3();

    // Make parent object to hold all the label divs in one Object3D.
    var element = document.createElement('div');
    var object = this.object = new MathBox.Sprite(element);
    element.className = 'mathbox-pointlabels';

    // Make sprites for all labels
    _.loop(n, function (i) {
      // Nested div to allow for relative positioning for centering
      var element = document.createElement('div');
      var inner = document.createElement('div');
      element.appendChild(inner);

      // Sprite object
      var sprite = new MathBox.Sprite(element, tangent);

      // Position at anchor point
      element.className = 'mathbox-pointlabel';
      inner.className = 'mathbox-wrap';
      inner.style.position = 'relative';
      inner.style.textAlign = 'left';
      inner.style.paddingLeft = '0.5em';
      inner.style.display = 'inline-block';
      //inner.style.left = '-50%';
      inner.style.top = '-.6em';

      sprites.push(sprite);
      object.add(sprite);
    });

    // Refresh material uniforms.
    //this.refresh();
  },

  adjust: function (viewport, camera, width, height, stage) {
    var options = this.get(),
        points = this.points,
        labels = this.labels,
        sprites = this.sprites,
        callback = this.callback,
        anchor = this._anchor,
        distance = options.distance,
        style = this.style,
        opacity = style.get('opacity');

    var mathjax = window.MathJax && MathJax.Hub;

    // Update labels
    _.each(sprites, function (sprite, i) {

      // Transform anchor point
      sprite.position.copy(points[i]);
      viewport.to(sprite.position);
      stage.matrix.multiplyVector3(sprite.position);
      sprite.distance = options.distance;

      // Set opacity
      sprite.opacity = opacity;

      // Set content
      var text = labels[i];

      if (!mathjax) {
        text = (''+text).replace(/^-/, '–');
      }

      if (sprite.content !== text) {
        var inner = sprite.element.children[0];

        sprite.content = text;
        sprite.measure = true;

        if (mathjax) {
          inner.innerHTML = "\\(" + text + "\\)";
          MathJax.Hub.queue.Push(["Typeset", MathJax.Hub, inner]);
        }
        else {
          inner.innerHTML = text;
        }
      }
    });

    MathBox.Renderable.prototype.adjust.call(this, viewport);
  },
});
