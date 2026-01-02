varying vec2 vUv;
uniform sampler2D displacementMap;
uniform float displacementScale;
uniform float displacementBias;

void main() {
  vUv = uv;
  vec3 displacedPosition = position + normal * (
    texture2D(displacementMap, uv).r * displacementScale + displacementBias
  );
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
