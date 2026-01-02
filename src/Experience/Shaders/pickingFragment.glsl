uniform sampler2D maskTexture;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(maskTexture, vUv);
  if (color.a < 0.1) discard;
  gl_FragColor = color;
}
