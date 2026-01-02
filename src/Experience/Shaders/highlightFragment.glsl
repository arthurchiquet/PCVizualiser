uniform sampler2D maskTexture;
uniform vec3 highlightColor;
uniform vec3 highlightOutputColor;
uniform float highlightAlpha;
varying vec2 vUv;

void main() {
    vec4 maskColor = texture2D(maskTexture, vUv);

    if (maskColor.a < 0.1) discard;

    float tolerance = 0.01;
    bool isParcel = all(lessThan(abs(maskColor.rgb - highlightColor), vec3(tolerance)));
    if (!isParcel) discard;

    // Offsets pour détecter le bord (4 voisins)
    float offset = 0.2 / 256.0;
    vec4 neighbor1 = texture2D(maskTexture, vUv + vec2(offset, 0.0));
    vec4 neighbor2 = texture2D(maskTexture, vUv + vec2(-offset, 0.0));
    vec4 neighbor3 = texture2D(maskTexture, vUv + vec2(0.0, offset));
    vec4 neighbor4 = texture2D(maskTexture, vUv + vec2(0.0, -offset));

    // Calcul distance au bord (0.0 = intérieur, 1.0 = bord)
    float dist = 0.0;
    dist += step(tolerance, length(maskColor.rgb - neighbor1.rgb));
    dist += step(tolerance, length(maskColor.rgb - neighbor2.rgb));
    dist += step(tolerance, length(maskColor.rgb - neighbor3.rgb));
    dist += step(tolerance, length(maskColor.rgb - neighbor4.rgb));
    dist = clamp(dist, 0.0, 1.0);

    // Interpolation alpha pour gradient intérieur -> bord
    float finalAlpha = mix(highlightAlpha * 0.3, highlightAlpha, dist);

    // Interpolation couleur pour dégradé léger vers le bord
    vec3 finalColor = mix(highlightOutputColor * 0.5, highlightOutputColor, dist);

    gl_FragColor = vec4(highlightOutputColor, finalAlpha);
}
