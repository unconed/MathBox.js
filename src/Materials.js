MathBox.Materials = function (stage) {
  this.stage = stage;
  this.list = [];
}

MathBox.Materials.prototype = {

  generic: function (options) {
    // Prepare new shadergraph factory.
    var factory = this.factory();
    options = options || {};
    var shaders = options.shaders || {};

    // Read out vertex position.
    if (shaders.position) {
      shaders.position(factory, this);
    }
    else {
      this.position(factory, options);

      // Apply viewport transform
      if (!options.absolute) {
        this.viewport(factory);
      }
    }

    // Apply finalizing shaders.
    return this.finalize(factory, options);
  },

  position: function (factory, options) {
    options = options || {};

    // Default position snippet
    var position = {
      mesh: 'getPositionNormal',
    }[options.type] || 'getPosition';

    // Fetch vertex position from three.js attributes
    factory
      .snippet(position)
      .snippet('mathTransform')

    return factory;
  },

  factory: function () {
    return new ShaderGraph.Factory();
  },

  finalize: function (factory, options) {
    // Read out shaders
    options = options || {};
    var shaders = options.shaders || {};

    // Transform point to view.
    factory
      .snippet('projectToView')

    if (shaders.material) {
      // Override material shader
      shaders.material(factory, this);
    }
    else {
      // Add default fragment shader
      var fragment = {
        points: 'fragmentSolidPoint',
        mesh: options.shaded ? 'fragmentShaded' : 'fragmentSolid',
      }[options.type] || 'fragmentSolid';

      factory.material('vertexOutput', fragment);
    }

    // Finish graph and compile program
    var graph = factory.end(),
        program = graph.compile();

    // Create Three.js material
    var material = new THREE.ShaderMaterial({
      uniforms: program.uniforms,
      attributes: program.attributes,
      vertexShader: program.vertexShader,
      fragmentShader: program.fragmentShader//,
    });

    // Set necessary three.js flags
    if (options.wireframe) {
      material.wireframe = true;
    }

    // Add .apply methods to update uniforms/attribs.
    var apply = this.apply.bind(this);
    material.applyUniforms = function (options) {
      apply(this, options, 'uniforms');
    };
    material.applyAttributes = function (options) {
      apply(this, options, 'attributes');
    };

    return material;
  },

  apply: function (material, options, type) {

    var fields = material[type];
    _.each(options, function (value, key) {
      var field = fields[key];
      if (field) {
        if (value instanceof THREE.Color) {
          value.x = value.r;
          value.y = value.g;
          value.z = value.b;
        }
        field.value = value;
        field.needsUpdate = true;
      }
    });

    if (type == 'uniforms') {
      if (options.lineWidth !== undefined) {
        material.wireframeLinewidth = material.linewidth = options.lineWidth;
      }
      if (options.opacity !== undefined) {
        material.transparent = options.opacity < 1;
      }
    }

  },

  viewport: function (factory, absolute) {
    this.stage.viewport().shader(factory, absolute);
  }//,
};
