
export const vertexShaderSource = `
    precision highp float;

    attribute vec4 a_position;
    attribute vec4 a_color;
    attribute vec2 a_texCoord;
    attribute vec3 a_normal;

    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;

    // New uniforms
    uniform float u_time;
    uniform bool u_isLiquid;

    struct Wave {
        vec2 direction;
        float frequency;
        float amplitude;
        float speed;
        float steepness;
    };
    uniform Wave u_waves[4];
    
    varying lowp vec4 v_color;
    varying highp vec2 v_texCoord;
    varying vec3 v_worldPosition;
    varying vec3 v_worldNormal;

    vec3 gerstnerWave (vec2 xz_pos, Wave wave, inout vec3 tangent, inout vec3 binormal) {
        float dot_dir_pos = dot(wave.direction, xz_pos);
        float phase = wave.speed * u_time;
        float sin_val = sin(dot_dir_pos * wave.frequency + phase);
        float cos_val = cos(dot_dir_pos * wave.frequency + phase);

        float displacement_y = wave.amplitude * sin_val;
        float displacement_x = wave.steepness * wave.amplitude * wave.direction.x * cos_val;
        float displacement_z = wave.steepness * wave.amplitude * wave.direction.y * cos_val;

        float wa = wave.frequency * wave.amplitude;
        tangent += vec3(
            1.0 - wave.steepness * wa * wave.direction.x * wave.direction.x * sin_val,
            wa * wave.direction.x * cos_val,
            -wave.steepness * wa * wave.direction.x * wave.direction.y * sin_val
        );
        binormal += vec3(
            -wave.steepness * wa * wave.direction.x * wave.direction.y * sin_val,
            wa * wave.direction.y * cos_val,
            1.0 - wave.steepness * wa * wave.direction.y * wave.direction.y * sin_val
        );
        
        return vec3(displacement_x, displacement_y, displacement_z);
    }


    void main() {
        if (u_isLiquid) {
            vec3 pos = a_position.xyz;
            vec3 tangent = vec3(1.0, 0.0, 0.0);
            vec3 binormal = vec3(0.0, 0.0, 1.0);
            
            for (int i = 0; i < 4; i++) {
                pos += gerstnerWave(a_position.xz, u_waves[i], tangent, binormal);
            }

            vec3 normal = normalize(cross(binormal, tangent));
            
            v_worldPosition = (u_model * vec4(pos, 1.0)).xyz;
            v_worldNormal = normalize((u_model * vec4(normal, 0.0)).xyz);
            gl_Position = u_projection * u_view * vec4(v_worldPosition, 1.0);

        } else {
            v_worldPosition = (u_model * a_position).xyz;
            v_worldNormal = normalize((u_model * vec4(a_normal, 0.0)).xyz);
            gl_Position = u_projection * u_view * u_model * a_position;
            v_color = a_color;
            v_texCoord = a_texCoord;
        }
    }
`;