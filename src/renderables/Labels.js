/**
 * Label, text labels anchored to points in 3D
 *
 * Note: uses CSS3D renderer classes, but positions overlays in 2D using the custom
 * overlay class. This avoids fuzzy text and undesirable scaling of text.
 */
MathBox.Renderable.Labels = function (points, tangent, callback, options, style) {
  this.points = points;
  this.tangent = tangent;
  this.callback = callback;

  this.sprites = [];

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.Labels.prototype = _.extend(new MathBox.Renderable(null), {

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
        tangent = this.tangent,
        sprites = this.sprites,
        n = this.points.length;

    // Reusable vector for later.
    this._anchor = new THREE.Vector3();

    // Make parent object to hold all the label divs in one Object3D.
    var element = document.createElement('div');
    var object = this.object = new MathBox.Sprite(element);
    element.className = 'mathbox-labels';

    // Make sprites for all labels
    _.loop(n, function (i) {
      // Nested div to allow for relative positioning for centering
      var element = document.createElement('div');
      var inner = document.createElement('div');
      element.appendChild(inner);

      // Sprite object
      var sprite = new MathBox.Sprite(element, tangent);

      // Position at anchor point
      element.className = 'mathbox-label';
      inner.className = 'mathbox-wrap';
      inner.style.position = 'relative';
      inner.style.display = 'inline-block';
      inner.style.left = '-50%';
      inner.style.top = '-.5em';

      sprites.push(sprite);
      object.add(sprite);
    });

    // Refresh material uniforms.
    //this.refresh();
  },

  adjust: function (viewport, camera, width, height, stage) {
    var options = this.get(),
        points = this.points,
        sprites = this.sprites,
        callback = this.callback,
        anchor = this._anchor,
        distance = options.distance,
        decimals = options.decimals,
        style = this.style,
        opacity = style.get('opacity');

    var mathjax = window.MathJax && MathJax.Hub;

    var ilog10 = 1/Math.log(10);

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
      var text = '';
      if (callback) {
        // Get text
        text = callback(i);
        if (text === undefined) text = '';

        // Try to cast to number and round to n decimals
        if (+text == text) {
          var x = +text;
          if (x != 0) {
            var s = x < 0 ? -1 : 1;
            x = Math.abs(x);
            var unit = Math.pow(10, (decimals - 1) - Math.floor(Math.log(x) * ilog10));
            x = s * Math.round(unit * x) / unit;
            text = x;
          }
        }

        if (!mathjax) {
          text = (''+text).replace(/^-/, '–');
        }
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

