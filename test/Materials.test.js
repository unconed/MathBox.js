Test.Tests.Materials = function (assert, done) {

  // Prepare stage.
  var stage = new MathBox.Stage();
  var viewport = stage.viewport();
  var materials = stage.materials;

  assert(viewport instanceof MathBox.ViewportCartesian, "Stage has cartesian viewport");
  assert(materials instanceof MathBox.Materials, "Stage has material manager");

  // Prepare material / shadergraph
  var material = materials.generic();
  var uniforms = material.uniforms;
  var vertex = material.vertexShader;
  var fragment = material.fragmentShader;

  assert(material instanceof THREE.ShaderMaterial, "Line material created");

  assert(uniforms.viewportTransform && uniforms.viewportTransform.type == 'm4', "Has m4 viewportTransform uniform");
  assert(uniforms.color && uniforms.color.type == 'v3', "Has v3 color uniform");
  assert(uniforms.opacity && uniforms.opacity.type == 'f', "Has f opacity uniform");

  assert(vertex.match(/\bgl_Position\s*=/), "gl_Position is assigned");
  assert(fragment.match(/\bgl_FragColor\s*=/), "gl_FragColor is assigned");

  done();
};