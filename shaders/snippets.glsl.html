<script type="application/x-glsl" id="bezierSurface3">
// Vertex shader: bicubic bezier surface

// These matrices contain M*P*M precalculated where m = bezier matrix and p = control points.
uniform mat4 bezierSurfaceX;
uniform mat4 bezierSurfaceY;
uniform mat4 bezierSurfaceZ;

const float epsilon = 0.01;

void bezierSurface3(out vec3 positionOut, out vec3 positionDUOut, out vec3 positionDVOut) {
  // uv  = tu,   tv
  // uv2 = tu^2, tv^2
  // uv3 = tu^3, tv^3
  vec2 uv = position.xy;
  vec2 uv2 = uv * uv;
  vec2 uv3 = uv * uv2;

  // t vector for u and v directions
  vec4 tu = vec4(uv3.x, uv2.x, uv.x, 1.0);
  vec4 tv = vec4(uv3.y, uv2.y, uv.y, 1.0);

  // t derivative vector for u and v directions
  vec2 uv_2 = uv * 2.0; // 2t
  vec2 uv2_3 = uv2 * 3.0; // 3t^2
  vec4 dtu = vec4(uv2_3.x, uv_2.x, 1.0, 0.0);
  vec4 dtv = vec4(uv2_3.y, uv_2.y, 1.0, 0.0);

  // interpolate position.
  positionOut.x = dot(tu, bezierSurfaceX * tv);
  positionOut.y = dot(tu, bezierSurfaceY * tv);
  positionOut.z = dot(tu, bezierSurfaceZ * tv);

  // interpolate tangent U.
  vec3 tU;
  tU.x = dot(dtu, bezierSurfaceX * tv);
  tU.y = dot(dtu, bezierSurfaceY * tv);
  tU.z = dot(dtu, bezierSurfaceZ * tv);

  // interpolate tangent V.
  vec3 tV;
  tV.x = dot(tu, bezierSurfaceX * dtv);
  tV.y = dot(tu, bezierSurfaceY * dtv);
  tV.z = dot(tu, bezierSurfaceZ * dtv);

  // output adjacent positions in DU / DV for determining normal post-transform.
  positionDUOut = positionOut + tU * epsilon;
  positionDVOut = positionOut + tV * epsilon;
}
</script>

<script type="application/x-glsl" id="bezier1">
// Vertex shader: line (1st order bezier)
uniform vec3 bezierPoints[2];

void bezier1(out vec3 positionOut) {
  float t = position.x;

  vec3 a = bezierPoints[0];
  vec3 b = bezierPoints[1];

  positionOut = a + (b - a) * t;
}
</script>

<script type="application/x-glsl" id="bezier2">
// Vertex shader: quadratic bezier curve
uniform vec3 bezierPoints[3];

void bezier2(out vec3 positionOut) {
  float t = position.x;
  float it = (1.0 - t);

  vec3 a = bezierPoints[0];
  vec3 b = bezierPoints[1];
  vec3 c = bezierPoints[2];

  vec3 d = 2.0 * b;
  vec3 e = t * c;
  vec3 f = a + (d - a) * t;
  vec3 g = f + (e - f) * t;

  positionOut = g;
}
</script>

<script type="application/x-glsl" id="bezier3">
// Vertex shader: cubic bezier curve
uniform vec3 bezierPoints[4];

void bezier3(out vec3 positionOut) {
  float t = position.x;
  float t2 = t * t, it2 = (1.0 - t)*(1.0 - t);

  vec3 a = bezierPoints[0];
  vec3 b = bezierPoints[1];
  vec3 c = bezierPoints[2];
  vec3 d = bezierPoints[3];

  vec3 e = 3.0 * b;
  vec3 f = 3.0 * c;
  vec3 g = a + (e - a) * t;
  vec3 h = f + (d - f) * t;

  positionOut = g*it2 + h*t2;
}
</script>

<script type="application/x-glsl" id="tickVertexSplit">
// Vertex shader: split position into two, to transform a differential along.
uniform vec3 tickEpsilon;

void tickVertex(in vec3 positionIn, out vec3 positionA, out vec3 positionB) {
  positionA = positionIn;
  positionB = positionIn + tickEpsilon;
}
</script>

<script type="application/x-glsl" id="tickVertexJoin">
// Vertx shader: join position + differential, render normalized tick marks.
attribute float tickSign;
uniform float tickSize;

void tickVertex(in vec3 positionA, in vec3 positionB, out vec3 positionOut) {
  vec3 diff = normalize(positionB - positionA);

  positionOut = positionA + diff * tickSign * tickSize;
}
</script>

<script type="application/x-glsl" id="polarPower">
// Vertex shader: apply a power operator to complex numbers represented in polar coordinates.
uniform float polarPower;
uniform float polarFold;

void polarPower(in vec3 positionIn, out vec3 positionOut) {

  if (polarPower != 1.0 || polarFold != 1.0) {
    positionOut = vec3(
      positionIn.x * polarFold,
      sign(positionIn.y) * pow(abs(positionIn.y), polarPower),
      positionIn.z//,
    );
  }
  else {
    positionOut = positionIn;
  }
}
</script>

<script type="application/x-glsl" id="worldToMath">
// Vertex shader: transform from world-space to math-space
uniform mat4 viewportInverse;

void worldToMath(in vec3 positionIn, out vec3 positionOut) {
  vec4 pos4 = viewportInverse * vec4(positionIn, 1.0);
  positionOut = pos4.xyz;
}
</script>

<script type="application/x-glsl" id="mathToWorld">
// Vertex shader: transform from math-space to world-space
uniform mat4 viewportTransform;

void mathToWorld(in vec3 positionIn, out vec3 positionOut) {
  vec4 pos4 = viewportTransform * vec4(positionIn, 1.0);
  positionOut = pos4.xyz;
}

</script>

<script type="application/x-glsl" id="projectiveTransform">
// Vertex shader: apply the projective viewport transform
uniform mat4 projectiveTransform;

void projective(in vec3 positionIn, out vec3 positionOut) {
  vec4 pos4 = projectiveTransform * vec4(positionIn, 1.0);
  positionOut = pos4.xyz / pos4.w;
}
</script>

<script type="application/x-glsl" id="mathTransform">
// Vertex shader: apply an arbitrary transform in math space
uniform mat4 mathTransform;

void mathTransform(in vec3 positionIn, out vec3 positionOut) {
  vec4 pos4 = mathTransform * vec4(positionIn, 1.0);
  positionOut = pos4.xyz / pos4.w;
}
</script>

<script type="application/x-glsl" id="worldTransform">
// Vertex shader: apply an arbitrary transform in world space
uniform mat4 worldTransform;

void worldTransform(in vec3 positionIn, out vec3 positionOut) {
  vec4 pos4 = worldTransform * vec4(positionIn, 1.0);
  positionOut = pos4.xyz / pos4.w;
}
</script>

<script type="application/x-glsl" id="cartesianToPolar">
// Vertex shader: transform smoothly between cartesian viewport and polar viewport.
uniform float polarAlpha;
uniform float polarFocus;
uniform float polarAspect;
uniform float polarHelix;

void cartesianToPolar(in vec3 positionIn, out vec3 positionOut) {
  if (polarAlpha > 0.0001) {
    vec2 xy = positionIn.xy * vec2(polarAlpha, polarAspect);
    float radius = polarFocus + xy.y;
    positionOut = vec3(
      sin(xy.x) * radius,
      (cos(xy.x) * radius - polarFocus) / polarAspect,
      positionIn.z + positionIn.x * polarHelix * polarAlpha//,
    );
  }
  else {
    positionOut = positionIn;
  }
}
</script>

<script type="application/x-glsl" id="cartesianToSphere">
// Vertex shader: transform smoothly between cartesian viewport and spherical viewport.
uniform float sphereAlpha;
uniform float sphereFocus;
uniform float sphereAspectX;
uniform float sphereAspectY;
uniform float sphereYScale;

void cartesianToSphere(in vec3 positionIn, out vec3 positionOut) {
  if (sphereAlpha > 0.0001) {
    vec3 xyz = positionIn.xyz * vec3(sphereAlpha, sphereAlpha / sphereAspectY * sphereYScale, sphereAspectX);
    float radius = sphereFocus + xyz.z;
    float cosTR = cos(xyz.y) * radius;
    positionOut = vec3(
      sin(xyz.x) * cosTR,
      sin(xyz.y) * radius * sphereAspectY,
      (cos(xyz.x) * cosTR - sphereFocus) / sphereAspectX//,
    );
  }
  else {
    positionOut = positionIn;
  }
}
</script>

<script type="application/x-glsl" id="projectToView">
// Vertex shader: project points to view (and apply zIndex bias).
uniform float zIndex;

void projectToView(in vec3 positionIn, out vec4 positionOut, out vec3 viewPositionOut) {
  vec4 worldPosition = modelViewMatrix * vec4(positionIn, 1.0);

  viewPositionOut = -worldPosition.xyz;

  positionOut = projectionMatrix * worldPosition;
  positionOut.z -= zIndex * .00001;
}
</script>

<script type="application/x-glsl" id="projectToViewNormal">
// Vertex shader: project points to view (and apply zIndex bias).
uniform float zIndex;
varying vec3 vNormal;

void projectToView(in vec3 positionIn, out vec4 positionOut, out vec3 viewPositionOut) {
  vec4 worldPosition = modelViewMatrix * vec4(positionIn, 1.0);

  vNormal = normalMatrix * normal;

  viewPositionOut = -worldPosition.xyz;

  positionOut = projectionMatrix * worldPosition;
  positionOut.z -= zIndex * .00001;
}
</script>

<script type="application/x-glsl" id="projectToViewDUDV">
// Vertex shader: project points + DU/DV to view (and apply zIndex bias).
uniform float zIndex;
varying vec3 vNormal;

void projectToView(in vec3 positionIn, in vec3 positionDUIn, in vec3 positionDVIn, out vec4 positionOut, out vec3 viewPositionOut) {
  vec4 worldPosition = modelViewMatrix * vec4(positionIn, 1.0);
  vec4 worldPositionDU = modelViewMatrix * vec4(positionDUIn, 1.0);
  vec4 worldPositionDV = modelViewMatrix * vec4(positionDVIn, 1.0);

  vec3 du = worldPositionDU.xyz - worldPosition.xyz;
  vec3 dv = worldPositionDV.xyz - worldPosition.xyz;
  vNormal = normalize(cross(dv, du));

  viewPositionOut = -worldPosition.xyz;

  positionOut = projectionMatrix * worldPosition;
  positionOut.z -= zIndex * .00001;
}

</script>

<script type="application/x-glsl" id="getPosition">
// Vertex shader: read three.js vertex position attribute
void getPosition(out vec3 positionOut) {
  positionOut = position;
}
</script>

<script type="application/x-glsl" id="getPositionDUDV">
attribute vec3 positionDU;
attribute vec3 positionDV;

// Vertex shader: read three.js vertex position attribute
void getPositionDUDV(out vec3 positionOut, out vec3 positionDUOut, out vec3 positionDVOut) {
  positionOut = position;
  positionDUOut = positionDU;
  positionDVOut = positionDV;
}
</script>

<script type="application/x-glsl" id="vertexOutput">
// Vertex shader: set GL vertex properties and varyings
uniform float pointSize;

uniform vec4 offsetRepeat;
varying vec2 vUV;

varying vec3 vViewPosition;

void vertexOutput(in vec4 position, in vec3 viewPosition) {
  gl_Position = position;
  gl_PointSize = pointSize;

  vUV = uv * offsetRepeat.zw + offsetRepeat.xy;
  vViewPosition = viewPosition;
}
</script>

<script type="application/x-glsl" id="fragmentShaded">
// Fragment shader: render a shaded surface fragment.
uniform vec3 color;
uniform float opacity;
uniform float mapColor;
uniform float mapOpacity;

uniform sampler2D texture;
varying vec2 vUV;

varying vec3 vNormal;
varying vec3 vViewPosition;
uniform float flipSided;

void fragmentShaded() {
  if (opacity < 0.01) discard;

  float shininess = 5.0;

	vec3 normal = normalize(vNormal);
	#ifdef DOUBLE_SIDED
	  normal = normal * (-1.0 + 2.0 * float(gl_FrontFacing)) * flipSided;
	#endif

  vec3 viewPosition = normalize(vViewPosition);
  vec3 lightPosition = (viewMatrix * vec4(1.0, 2.0, -1.0, 0.0)).xyz;
  vec3 lightVector = normalize(lightPosition);

  float dotNormal = dot(normal, lightVector);
  float diffuse = dotNormal * .5 + .5;
	#ifdef DOUBLE_SIDED
	  if (!gl_FrontFacing) {
	    diffuse = diffuse * .9 + .1;
	  }
	#endif

	vec3 halfVector = normalize(lightVector + viewPosition);
	float dotNormalHalf = max(dot(normal, halfVector), 0.0);
	float specular = pow(max(dotNormalHalf, 0.0), shininess);

  vec4 sample = texture2D(texture, vUV);

  float alpha = opacity * (1.0 - mapOpacity * (1.0 - sample.w));
  if (alpha < 0.01) discard;

  vec3 sampleLinear = sample.xyz * sample.xyz;
  vec3 colorLinear = color * color;

  // Don't ungamma the specular value, looks nicer, it adds subtle color shading
  vec3 specColor = normalize(.1 + sqrt(color)) * .35 * specular;

  vec3 textured = colorLinear + (colorLinear * sampleLinear.xyz - colorLinear) * mapColor;

  gl_FragColor = vec4(sqrt(max(vec3(0.0, 0.0, 0.0), textured * diffuse + specColor)), alpha);
}
</script>

<script type="application/x-glsl" id="fragmentSolid">
// Fragment shader: render a solid surface fragment.
uniform vec3 color;
uniform float opacity;
uniform float mapColor;
uniform float mapOpacity;

uniform sampler2D texture;
varying vec2 vUV;

void fragmentSolid() {
  if (opacity < 0.01) discard;

  vec4 sample = texture2D(texture, vUV);
  float alpha = opacity * (1.0 - mapOpacity * (1.0 - sample.w));
  if (alpha < 0.01) discard;

  vec3 textured = color + (color * sample.xyz - color) * mapColor;

  gl_FragColor = vec4(textured, alpha);
}
</script>

<script type="application/x-glsl" id="fragmentSolidPoint">
// Fragment shader: render an anti-aliased circular point sprite.
uniform vec3 color;
uniform float opacity;
uniform float pointSize;

void fragmentSolidPoint() {
  float c = dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5) * 4.0;
  if (c > 1.0) {
    discard;
  }
  float edgeAlpha = min(1.0, .25 * pointSize * (1.0 - c));
  gl_FragColor = vec4(color, opacity * edgeAlpha);
}
</script>

<script type="application/x-glsl" id="fragmentTexture">
// Fragment shader: render a textured sample.
uniform sampler2D texture;
varying vec2 vUV;

void fragmentTexture() {
    gl_FragColor = texture2D(texture, vUV);
}
</script>

