uniform sampler2D tDiffuse;
uniform float offset;
uniform float darkness;
varying vec2 vUv;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float dist = distance(vUv, vec2(0.5));
    float vignette = smoothstep(offset, 0.8, dist) * darkness;

    color.rgb = mix(color.rgb, color.rgb * 0.5, vignette);
    gl_FragColor = color;
}