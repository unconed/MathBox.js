/**
 * Material manager. Generates custom ShaderMaterials that perform
 * all the right transforms and stylings.
 *
 * Uses ShaderGraph to glue together basic snippets, which can be
 * overridden on a section by section basis.
 */
MathBox.Materials = function (stage) {
  this.stage = stage;
  this.list = [];
}

MathBox.Materials.prototype = {

  /**
   * Return a generic material.
   */
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
        if (options.shaded) {
          // Viewport transform for position + DU/DV
          factory.group();
          this.viewport(factory);
          factory.next();
          this.viewport(factory);
          factory.next();
          this.viewport(factory);
          factory.combine();
        }
        else {
          // Viewport transform for position
          this.viewport(factory);
        }
      }
    }

    // Apply finalizing shaders.
    return this.finalize(factory, options);
  },

  /**
   * Insert the position snippet into a shadergraph factory.
   */
  position: function (factory, options) {
    options = options || {};

    // Default position snippet
    var position = options.shaded ? 'getPositionDUDV' : 'getPosition';

    // Fetch vertex position from three.js attributes
    factory
      .snippet(position);

    // Apply math transform
    if (options.shaded) {
      // Transform position + DU/DV offset positions
      factory
        .group()
          .snippet('mathTransform')
        .next()
          .snippet('mathTransform')
        .next()
          .snippet('mathTransform')
        .combine();
    }
    else {
      // Transform just position
      factory.snippet('mathTransform');
    }

    return factory;
  },

  /**
   * New factory
   */
  factory: function () {
    return new ShaderGraph.Factory();
  },

  /**
   * Finalize a shadergraph by adding on final transforms and a material shader.
   */
  finalize: function (factory, options) {
    // Read out shaders
    options = options || {};
    var shaders = options.shaders || {};

    // Transform point to view.
    if (options.shaded) {
      factory
        .snippet('projectToViewDUDV')
    }
    else {
      factory
        .snippet('projectToView')
    }

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

  /**
   * Apply uniforms/attributes to a material
   */
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

  /**
   * Add viewport transform to a shadergraph factory.
   */
  viewport: function (factory, absolute) {
    this.stage.viewport().shader(factory, absolute);
  }//,
};
