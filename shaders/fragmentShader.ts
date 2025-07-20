


export const fragmentShaderSource = `
    precision highp float;

    varying lowp vec4 v_color;
    varying highp vec2 v_texCoord;
    varying highp vec3 v_worldPosition;
    varying highp vec3 v_worldNormal;

    uniform sampler2D u_albedoTexture;
    uniform bool u_useTexture;
    uniform vec3 u_tint;
    uniform vec3 u_emissive;
    uniform vec4 u_fallbackColor;
    uniform vec2 u_tiling;
    uniform vec2 u_offset;

    uniform float u_time;
    uniform vec3 u_cameraPos;
    
    // Lighting
    uniform vec3 u_lightPos; // For directional lights, this is the direction.
    uniform vec3 u_lightColor;

    // Liquid uniforms
    uniform bool u_isLiquid;
    uniform vec3 u_liquidBaseColor;
    uniform vec3 u_liquidDeepColor;
    uniform float u_liquidDepthDistance;
    uniform vec3 u_liquidSpecularColor;
    uniform float u_liquidShininess;
    uniform vec3 u_liquidSssColor;
    uniform float u_liquidSssPower;
    uniform vec3 u_foamColor;
    uniform float u_foamCrestMin;
    uniform float u_foamCrestMax;

    // Terrain uniforms
    uniform bool u_isTerrain;
    uniform sampler2D u_grassTexture;
    uniform sampler2D u_rockTexture;
    uniform sampler2D u_snowTexture;
    uniform sampler2D u_sandTexture;


    // Ripple uniforms
    uniform vec4 u_ripples[100]; // x, z, startTime, strength
    uniform int u_rippleCount;

    // Global underwater/caustics uniforms
    uniform bool u_isUnderwater;
    uniform float u_waterHeight;
    uniform sampler2D u_causticsTexture;
    uniform float u_causticsTiling;
    uniform float u_causticsSpeed;
    uniform float u_causticsBrightness;


    // --- UTILITY FUNCTIONS ---

    float getRipple(float dist, float timeSinceDrop, float strength) {
        float waveSpeed = 2.0;
        float waveFrequency = 40.0;
        float waveWidth = 0.3;
        float lifetime = 3.0;
        if (timeSinceDrop < 0.0 || timeSinceDrop > lifetime) return 0.0;
        float currentRadius = timeSinceDrop * waveSpeed;
        float distFromWave = abs(dist - currentRadius);
        if (distFromWave > waveWidth) return 0.0;
        float radialSine = sin((currentRadius - dist) * 3.14159 * waveFrequency);
        float fade = pow(1.0 - timeSinceDrop / lifetime, 2.0);
        float radialFade = 1.0 - distFromWave / waveWidth;
        return radialSine * fade * radialFade * strength * 0.1;
    }
    
    // Psuedo-random noise function
    float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // --- MAIN SHADER ---

    void main() {
        if (u_isLiquid) {
            vec3 lightDir = normalize(u_lightPos);
            vec3 viewDir = normalize(u_cameraPos - v_worldPosition);

            // --- NORMAL CALCULATION (Ripples) ---
            vec3 normalPerturbation = vec3(0.0);
            for(int i = 0; i < 100; i++) {
                if (i >= u_rippleCount) break;
                vec4 rippleData = u_ripples[i];
                float timeSinceDrop = u_time - rippleData.z;
                float dist = distance(v_worldPosition.xz, rippleData.xy);
                float rippleStrength = getRipple(dist, timeSinceDrop, rippleData.w);
                if (rippleStrength != 0.0) {
                    vec2 dir = normalize(v_worldPosition.xz - rippleData.xy);
                    normalPerturbation += vec3(dir.x, 0.0, dir.y) * rippleStrength;
                }
            }
            vec3 normal = normalize(v_worldNormal - normalPerturbation);
            
            // --- FRESNEL ---
            float fresnel = 0.02 + (1.0 - 0.02) * pow(1.0 - dot(viewDir, normal), 5.0);

            // --- SKY REFLECTION ---
            vec3 reflectDir = reflect(-viewDir, normal);
            float skyMix = 0.5 * (reflectDir.y + 1.0);
            vec3 skyColor = (1.0 - skyMix) * vec3(0.9, 0.9, 0.9) + skyMix * vec3(0.5, 0.7, 1.0);
            
            // --- SPECULAR LIGHTING ---
            vec3 halfwayDir = normalize(lightDir + viewDir);
            float specAngle = max(dot(normal, halfwayDir), 0.0);
            float specular = pow(specAngle, u_liquidShininess);
            
            // --- SUBSURFACE SCATTERING (SSS) ---
            float sssDot = pow(max(0.0, dot(lightDir, -viewDir)), u_liquidSssPower);
            vec3 sss = u_liquidSssColor * sssDot;

            // --- DEPTH-BASED COLOR ---
            float depth = distance(v_worldPosition, u_cameraPos);
            float depthFactor = clamp(depth / u_liquidDepthDistance, 0.0, 1.0);
            vec3 waterColor = mix(u_liquidBaseColor, u_liquidDeepColor, depthFactor);

            // --- FOAM ---
            float foamNoise = noise(v_worldPosition.xz * 2.0);
            float foamAmount = smoothstep(u_foamCrestMin, u_foamCrestMax, v_worldPosition.y + foamNoise * 0.1);
            vec3 finalColor = mix(waterColor, u_foamColor, foamAmount);
            
            // --- COMBINE EVERYTHING ---
            finalColor = mix(finalColor, skyColor, fresnel);
            finalColor += u_liquidSpecularColor * specular * u_lightColor;
            finalColor += sss;

            gl_FragColor = vec4(finalColor, 1.0);
        } else if (u_isTerrain) {
            vec3 world_normal = normalize(v_worldNormal);
            vec3 world_pos = v_worldPosition;
            
            // Tri-planar blend weights based on normal direction for cliffs
            vec3 weights = abs(world_normal);
            weights = pow(weights, vec3(8.0)); // Sharpen the blend
            weights /= (weights.x + weights.y + weights.z);

            // Sample textures
            vec3 grass_color = texture2D(u_grassTexture, world_pos.xz * 0.05).rgb;
            vec3 rock_color = texture2D(u_rockTexture, world_pos.yz * 0.05).rgb * weights.x + texture2D(u_rockTexture, world_pos.xy * 0.05).rgb * weights.z;
            vec3 snow_color = texture2D(u_snowTexture, world_pos.xz * 0.1).rgb;
            vec3 sand_color = texture2D(u_sandTexture, world_pos.xz * 0.2).rgb;
            
            // --- Blending Logic ---
            float height = world_pos.y;
            float slope = 1.0 - world_normal.y;

            // 1. Base is grass
            vec3 base_color = grass_color;

            // 2. Blend sand near water level
            float sand_factor = 1.0 - smoothstep(u_waterHeight - 1.0, u_waterHeight + 2.5, height);
            sand_factor *= (1.0 - smoothstep(0.25, 0.4, slope)); // Less sand on steep slopes
            base_color = mix(base_color, sand_color, sand_factor);

            // 3. Blend rock on steep slopes, but not on sand
            float rock_factor = smoothstep(0.45, 0.7, slope);
            base_color = mix(base_color, rock_color, rock_factor * (1.0 - sand_factor));

            // 4. Blend snow at high altitudes
            float snow_factor = smoothstep(18.0, 25.0, height);
            snow_factor *= (1.0 - smoothstep(0.3, 0.5, slope));
            base_color = mix(base_color, snow_color, snow_factor);

            // --- Lighting ---
            vec3 lightDir = normalize(u_lightPos);
            vec3 viewDir = normalize(u_cameraPos - v_worldPosition);
            
            vec3 ambient = 0.2 * base_color;
            
            float diff = max(dot(world_normal, lightDir), 0.0);
            vec3 diffuse = diff * u_lightColor * base_color;
            
            vec3 halfwayDir = normalize(lightDir + viewDir);
            float spec = pow(max(dot(world_normal, halfwayDir), 0.0), 16.0); // low shininess for terrain
            vec3 specular = spec * u_lightColor * vec3(0.2); // white specular highlights

            vec3 final_color = ambient + diffuse + specular;

            gl_FragColor = vec4(final_color, 1.0);

        } else {
            vec4 baseColor;
            if (u_useTexture) {
                vec4 texColor = texture2D(u_albedoTexture, v_texCoord * u_tiling + u_offset);
                baseColor = vec4(texColor.rgb * u_tint, texColor.a);
            } else {
                if (v_color.a > 0.0) {
                     baseColor = v_color;
                } else {
                     vec2 uv = (v_texCoord * u_tiling + u_offset) * 8.0;
                     float checker = mod(floor(uv.x) + floor(uv.y), 2.0);
                     vec3 checkerColor = mix(vec3(0.7, 0.7, 0.7), vec3(0.9, 0.9, 0.9), checker);
                     baseColor = vec4(checkerColor * u_tint, 1.0);
                }
            }

            // --- Lighting ---
            vec3 normal = normalize(v_worldNormal);
            vec3 lightDir = normalize(u_lightPos);
            vec3 viewDir = normalize(u_cameraPos - v_worldPosition);

            vec3 ambient = 0.2 * baseColor.rgb;
            
            float diff = max(dot(normal, lightDir), 0.0);
            vec3 diffuse = diff * u_lightColor * baseColor.rgb;

            vec3 halfwayDir = normalize(lightDir + viewDir);
            float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
            vec3 specular = spec * u_lightColor;

            vec4 finalColor = vec4(ambient + diffuse + specular, baseColor.a);

            // --- UNDERWATER CAUSTICS ---
            if (u_isUnderwater && v_worldPosition.y < u_waterHeight) {
                // Animate two layers of caustics at different speeds/directions for a more natural look
                vec2 causticsUv1 = v_worldPosition.xz / u_causticsTiling + u_time * u_causticsSpeed * vec2(0.5, 0.3);
                vec2 causticsUv2 = v_worldPosition.xz / (u_causticsTiling * 0.7) - u_time * u_causticsSpeed * vec2(0.2, 0.4);
                
                float caustics1 = texture2D(u_causticsTexture, causticsUv1).r;
                float caustics2 = texture2D(u_causticsTexture, causticsUv2).r;
                
                float caustics = (caustics1 + caustics2) * 0.5 * u_causticsBrightness;

                // Apply caustics and a blueish tint for underwater effect
                finalColor.rgb *= (vec3(0.4, 0.8, 1.0) + caustics);
            }

            finalColor.rgb += u_emissive;
            gl_FragColor = finalColor;
        }
    }
`;