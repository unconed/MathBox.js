#!/bin/bash
VENDOR="
vendor/domready.js
vendor/underscore.js
vendor/tquery-bundle.js
vendor/jquery.min.js
"

GLVENDOR="
vendor/ThreeBox.js/vendor/microevent.js
vendor/ThreeBox.js/vendor/microajax.js
vendor/ThreeBox.js/build/ThreeBox-core.js
vendor/ThreeRTT.js/build/ThreeRTT-core-tquery.js
vendor/ShaderGraph.js/build/ShaderGraph-core.js
"

SRC="
src/Common.js
src/Attributes.js
src/Animator.js
src/Stage.js
src/Materials.js
src/Ticks.js
src/tQuery.js
src/Director.js
src/Style.js
src/CameraProxy.js
src/Overlay.js

src/primitives/Primitive.js
src/primitives/Curve.js
src/primitives/Bezier.js
src/primitives/Axis.js
src/primitives/Grid.js
src/primitives/Vector.js
src/primitives/Surface.js
src/primitives/BezierSurface.js
src/primitives/Platonic.js

src/renderables/Renderable.js
src/renderables/Mesh.js
src/renderables/ArrowHead.js
src/renderables/Ticks.js
src/renderables/Labels.js

src/viewports/Viewport.js
src/viewports/ViewportCartesian.js
src/viewports/ViewportPolar.js
src/viewports/ViewportProjective.js
src/viewports/ViewportSphere.js
"

SHADERS="
shaders/snippets.glsl.html
vendor/ThreeRTT.js/build/ThreeRTT.glsl.html
"

pushd vendor/ShaderGraph.js
./build.sh
popd

pushd vendor/ThreeBox.js
./build.sh
popd

pushd vendor/ThreeRTT.js
./build.sh
popd

cat $VENDOR $GLVENDOR $SRC > build/MathBox-bundle.js
cat $GLVENDOR $SRC > build/MathBox.js
cat $SRC > build/MathBox-core.js
cat $SHADERS > build/MathBox.glsl.html

if [ -z "$SKIP_MINIFY" ]; then
curl --data-urlencode "js_code@build/MathBox.js" 	\
	-d "output_format=text&output_info=compiled_code&compilation_level=SIMPLE_OPTIMIZATIONS&language=ECMASCRIPT5" \
	http://closure-compiler.appspot.com/compile	\
	> build/MathBox.min.js

curl --data-urlencode "js_code@build/MathBox-core.js" 	\
	-d "output_format=text&output_info=compiled_code&compilation_level=SIMPLE_OPTIMIZATIONS&language=ECMASCRIPT5" \
	http://closure-compiler.appspot.com/compile	\
	> build/MathBox-core.min.js

curl --data-urlencode "js_code@build/MathBox-bundle.js" 	\
	-d "output_format=text&output_info=compiled_code&compilation_level=SIMPLE_OPTIMIZATIONS&language=ECMASCRIPT5" \
	http://closure-compiler.appspot.com/compile	\
	> build/MathBox-bundle.min.js
fi