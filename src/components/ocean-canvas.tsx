import { motion, useReducedMotion, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import calmOcean from "@/assets/calm-ocean.jpg";
import nightSurf from "@/assets/night-surf.mp4";
import tidalStudy from "@/assets/tidal-study.jpg";

const vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_ocean;
  uniform vec2 u_resolution;
  uniform vec2 u_image_size;
  uniform float u_time;
  uniform float u_scroll;

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float layeredNoise(vec2 p, vec2 drift) {
    return noise(p + drift) * 0.68 + noise(p * 2.03 + drift * 1.7) * 0.32;
  }

  void main() {
    float time = u_time * 0.42 + u_scroll * 0.02;
    vec2 cover = vec2(1.0);
    float view_aspect = u_resolution.x / u_resolution.y;
    float image_aspect = u_image_size.x / u_image_size.y;
    if (image_aspect > view_aspect) {
      cover.x = view_aspect / image_aspect;
    } else {
      cover.y = image_aspect / view_aspect;
    }

    vec2 uv = (v_uv - 0.5) * cover * 0.62 + 0.5;
    vec2 water = uv * vec2(3.5, 5.0);
    float long_swell = layeredNoise(water, vec2(time * 0.18, -time * 0.11));
    float cross_swell = layeredNoise(water * 1.63, vec2(-time * 0.31, time * 0.24));
    float chop = noise(water * 2.8 + vec2(time * 0.45, time * 0.52));

    vec2 flow = vec2(cross_swell - long_swell, long_swell - chop);
    vec2 displacement = flow * 0.01;
    displacement.x += sin(uv.y * 18.0 + uv.x * 5.0 + time * 0.8) * 0.0015;
    uv = clamp(uv + displacement, 0.001, 0.999);

    vec3 color = texture2D(u_ocean, uv).rgb;
    color *= vec3(1.12, 1.22, 1.3);
    float edge = smoothstep(0.0, 0.18, v_uv.y) * (1.0 - smoothstep(0.78, 1.0, v_uv.y));
    color *= mix(0.72, 1.0, edge);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function OceanCanvas({
  theme,
  scrollY,
}: {
  theme: "calm" | "night";
  scrollY: MotionValue<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const [shaderReady, setShaderReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || theme === "night") {
      setShaderReady(false);
      return;
    }
    setShaderReady(false);

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const position = gl.getAttribLocation(program, "a_position");
    const buffer = gl.createBuffer();
    if (!buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    const texture = gl.createTexture();
    if (!texture) return;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uniforms = {
      ocean: gl.getUniformLocation(program, "u_ocean"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      imageSize: gl.getUniformLocation(program, "u_image_size"),
      time: gl.getUniformLocation(program, "u_time"),
      scroll: gl.getUniformLocation(program, "u_scroll"),
    };

    let frame = 0;
    let startedAt = 0;
    let mounted = true;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        1.25,
        Math.sqrt(2_000_000 / (bounds.width * bounds.height)),
      );
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    };

    const render = (timestamp: number) => {
      gl.uniform1f(uniforms.time, reduceMotion ? 0 : (timestamp - startedAt) * 0.001);
      gl.uniform1f(uniforms.scroll, reduceMotion ? 0 : scrollY.get());
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduceMotion) frame = window.requestAnimationFrame(render);
    };

    const image = new Image();
    image.onload = () => {
      if (!mounted) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(uniforms.ocean, 0);
      gl.uniform2f(uniforms.imageSize, image.naturalWidth, image.naturalHeight);
      resize();
      setShaderReady(true);
      startedAt = performance.now();
      frame = window.requestAnimationFrame(render);
    };
    image.src = calmOcean;

    window.addEventListener("resize", resize);
    return () => {
      mounted = false;
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [reduceMotion, scrollY, theme]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.img
        src={calmOcean}
        alt=""
        aria-hidden="true"
        className="absolute inset-[-18%] h-[136%] w-[136%] object-cover transition-opacity duration-700"
        style={{
          opacity: theme === "calm" && !shaderReady ? 1 : 0,
          filter: "brightness(1.12) saturate(.82)",
        }}
        animate={reduceMotion || shaderReady ? false : { scale: [1.02, 1.07, 1.02] }}
        transition={{ duration: 30, ease: "easeInOut", repeat: Infinity }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-[-8%] h-[116%] w-[116%] transition-opacity duration-700"
        style={{ opacity: theme === "calm" && shaderReady ? 1 : 0 }}
      />
      {theme === "night" && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload={reduceMotion ? "none" : "auto"}
          poster={tidalStudy}
          aria-hidden="true"
          style={{ filter: "brightness(.78) contrast(1.12) saturate(.9)" }}
        >
          <source src={nightSurf} type="video/mp4" />
        </video>
      )}
      <div
        className={`absolute inset-0 ${theme === "night" ? "bg-slate-950/10" : "bg-cyan-950/10"}`}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === "night"
              ? "linear-gradient(180deg, rgba(3,7,18,.08) 0%, rgba(3,7,18,.1) 42%, rgba(3,7,18,.34) 100%)"
              : "linear-gradient(180deg, rgba(3,7,18,.06) 0%, rgba(3,7,18,.08) 42%, rgba(3,7,18,.4) 100%)",
        }}
      />
    </div>
  );
}
