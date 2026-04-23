import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [voiceHint, setVoiceHint] = useState('Say "Hey VisionCure"');
  const [isListening, setIsListening] = useState(false);

  // --- Three.js Scene ---
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(6, 3.5, 10);
    camera.lookAt(0, 0.5, 0);

    // Renderer — transparent so the CSS gradient shows through
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.background = 'transparent';
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = Math.PI / 4;
    controls.target.set(0, 0.5, 0);


    // ---- Lighting (bright, warm, directional — light mode) ----
    scene.add(new THREE.AmbientLight(0xf0f0ff, 0.6));

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(5, 8, 5);
    sunLight.castShadow = false;
    scene.add(sunLight);

    const fillA = new THREE.PointLight(0x818cf8, 0.8, 30);
    fillA.position.set(-4, 3, 4);
    scene.add(fillA);

    const fillB = new THREE.PointLight(0xa78bfa, 0.6, 25);
    fillB.position.set(5, 1, -4);
    scene.add(fillB);

    const rimLight = new THREE.PointLight(0xc4b5fd, 1.0);
    rimLight.position.set(0, 5, 8);
    scene.add(rimLight);

    // ---- Central glowing orb ("the eye") ----
    const coreGroup = new THREE.Group();

    // Outer translucent sphere
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0xc7d2fe,
      emissive: new THREE.Color(0x6366f1),
      emissiveIntensity: 0.25,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.6,
      thickness: 1.5,
      transparent: true,
      opacity: 0.55,
      ior: 1.4,
    });
    const outerSphere = new THREE.Mesh(new THREE.SphereGeometry(1.6, 64, 64), outerMat);
    coreGroup.add(outerSphere);

    // Inner luminous core
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x818cf8,
      emissive: new THREE.Color(0x6366f1),
      emissiveIntensity: 0.8,
      roughness: 0.05,
      transparent: true,
      opacity: 0.65,
    });
    const innerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.95, 48, 48), innerMat);
    coreGroup.add(innerSphere);

    // Bright core center
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xe0e7ff,
      transparent: true,
      opacity: 0.8,
    });
    const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), coreMat);
    coreGroup.add(coreSphere);

    // Orbit rings
    const createRing = (radius, thickness, color, emissive, rx, ry, rz) => {
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(emissive),
        emissiveIntensity: 0.35,
        roughness: 0.2,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 32, 128), mat);
      mesh.rotation.set(rx, ry, rz);
      return mesh;
    };

    const ring1 = createRing(2.1, 0.035, 0x818cf8, 0x4f46e5, Math.PI / 2, 0.2, 0);
    const ring2 = createRing(2.4, 0.025, 0xa78bfa, 0x7c3aed, 1.1, 0, 0.5);
    const ring3 = createRing(2.7, 0.018, 0xc4b5fd, 0x8b5cf6, 0.5, 0.8, 0.3);
    coreGroup.add(ring1, ring2, ring3);

    // ---- Floating pills ----
    const pillGroup = new THREE.Group();

    function createPill(bodyColor, capColor, emissiveColor, scale, pos) {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: bodyColor,
        emissive: new THREE.Color(emissiveColor),
        emissiveIntensity: 0.1,
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
      });
      const capMat = new THREE.MeshPhysicalMaterial({
        color: capColor,
        emissive: new THREE.Color(emissiveColor),
        emissiveIntensity: 0.05,
        roughness: 0.2,
        clearcoat: 0.3,
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 16), bodyMat);
      body.rotation.z = Math.PI / 2;
      g.add(body);
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), capMat);
      s1.position.x = 0.35;
      g.add(s1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), bodyMat);
      s2.position.x = -0.35;
      g.add(s2);
      g.scale.setScalar(scale);
      g.position.set(...pos);
      return g;
    }

    pillGroup.add(createPill(0xe0e7ff, 0x818cf8, 0x4f46e5, 1.0, [3.0, 1.4, 1.2]));
    pillGroup.add(createPill(0xd1fae5, 0x6ee7b7, 0x10b981, 0.85, [-2.8, 1.8, -1.8]));
    pillGroup.add(createPill(0xfef3c7, 0xfcd34d, 0xf59e0b, 0.75, [1.8, -0.3, -3.0]));
    pillGroup.add(createPill(0xfce7f3, 0xf9a8d4, 0xec4899, 0.9, [-2.0, -0.6, 3.2]));
    pillGroup.add(createPill(0xdbeafe, 0x93c5fd, 0x3b82f6, 0.65, [2.5, 2.2, -2.5]));

    coreGroup.add(pillGroup);

    // ---- Particle cloud (subtle in light mode) ----
    const particleCount = 1200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 3 + Math.random() * 7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pPos[i] = Math.sin(phi) * Math.cos(theta) * r;
      pPos[i + 1] = Math.sin(phi) * Math.sin(theta) * r;
      pPos[i + 2] = Math.cos(phi) * r;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    coreGroup.add(particles);

    // Small orbiting orbs
    const orbGroup = new THREE.Group();
    for (let j = 0; j < 16; j++) {
      const mat = new THREE.MeshStandardMaterial({
        color: j % 2 === 0 ? 0xa78bfa : 0x818cf8,
        emissive: j % 2 === 0 ? 0x7c3aed : 0x4f46e5,
        emissiveIntensity: 0.4,
      });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat);
      const angle = (j / 16) * Math.PI * 2;
      const r = 2.8 + Math.sin(j * 1.3) * 0.7;
      orb.position.set(Math.cos(angle) * r, Math.sin(angle * 1.3) * 1.5, Math.sin(angle) * r * 0.8);
      orbGroup.add(orb);
    }
    coreGroup.add(orbGroup);

    coreGroup.position.set(3, 0.5, -2);  // offset right to complement the left-aligned text
    scene.add(coreGroup);



    // ---- Animation Loop ----
    let frameId;

    function animate() {
      const t = performance.now() * 0.001;

      controls.update();

      // Gentle bobbing of entire core
      coreGroup.rotation.y = Math.sin(t * 0.08) * 0.08;
      coreGroup.position.y = 0.5 + Math.sin(t * 0.5) * 0.15;

      // Rings slowly rotate
      ring1.rotation.z += 0.001;
      ring2.rotation.y += 0.0015;
      ring3.rotation.x += 0.0008;

      // Pills float independently
      pillGroup.children.forEach((pill, idx) => {
        pill.rotation.x += 0.004;
        pill.rotation.z += 0.002;
        pill.position.y += Math.sin(t * 1.2 + idx * 1.8) * 0.0015;
      });

      // Orbs slowly orbit
      orbGroup.rotation.y += 0.0015;
      orbGroup.rotation.x += 0.0005;

      // Particles drift
      particles.rotation.y += 0.0003;

      // Inner sphere pulse
      innerSphere.scale.setScalar(1 + Math.sin(t * 2.5) * 0.025);
      coreSphere.scale.setScalar(1 + Math.sin(t * 3) * 0.04);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    // Resize handler
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Voice hint simulation on double-click
  const handleCanvasDblClick = useCallback(() => {
    setIsListening(true);
    setVoiceHint('Listening... "Take Aspirin"');
    setTimeout(() => {
      setIsListening(false);
      setVoiceHint('Say "Hey VisionCure"');
    }, 2500);
  }, []);

  return (
    <div className="vc-landing">
      {/* Decorative blobs */}
      <div className="vc-blob vc-blob-1" />
      <div className="vc-blob vc-blob-2" />
      <div className="vc-blob vc-blob-3" />

      {/* Three.js Canvas */}
      <div className="vc-canvas" ref={canvasRef} onDoubleClick={handleCanvasDblClick} />

      {/* ---- Top Nav ---- */}
      <nav className="vc-nav">
        <div className="vc-logo">
          <div className="vc-logo-icon">
            <i className="fas fa-eye" />
          </div>
          <span className="vc-logo-text">VisionCure</span>
        </div>
        <div className="vc-nav-right">
          <div className="vc-status-badge">
            <span className="vc-status-dot" />
            <i className="fas fa-microphone-alt" style={{ fontSize: '0.8rem' }} />
            <span>Voice AI Active</span>
          </div>
          <button className="vc-login-btn" onClick={() => navigate('/login')}>
            <i className="fas fa-arrow-right" /> Get Started
          </button>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <div className="vc-main">
        <div className="vc-hero">
          <div className="vc-hero-eyebrow">
            <i className="fas fa-sparkles" />
            AI-Powered Healthcare
          </div>
          <h1 className="vc-hero-title">
            Your <span className="vc-gradient-text">intelligent</span> medication companion
          </h1>
          <p className="vc-hero-subtitle">
            Safe, independent care designed with dignity for elderly and visually impaired users. Scan, verify, and take your medicine with confidence.
          </p>
          <div className="vc-cta-group">
            <button className="vc-cta-primary" onClick={() => navigate('/login')}>
              <i className="fas fa-play" /> Start Using VisionCure
            </button>
            <button className="vc-cta-secondary" onClick={() => navigate('/login')}>
              <i className="fas fa-camera" /> Try Scanner
            </button>
          </div>
          <div className="vc-features">
            <div className="vc-feature-tag">
              <i className="fas fa-robot" /> Groq + LLaMA 3.3
            </div>
            <div className="vc-feature-tag">
              <i className="fas fa-camera" /> Gemini Vision
            </div>
            <div className="vc-feature-tag">
              <i className="fas fa-shield-alt" /> Safety Checks
            </div>
            <div className="vc-feature-tag">
              <i className="fas fa-clock" /> Smart Timeline
            </div>
          </div>
        </div>
      </div>

      {/* ---- Bottom Dock ---- */}
      <div className="vc-dock">
        <div className="vc-timeline-items">
          <div className="vc-time-chip active">
            <span className="vc-time-dot" />
            <strong>08:00</strong>&nbsp;Aspirin
          </div>
          <i className="fas fa-chevron-right vc-time-chevron" />
          <div className="vc-time-chip pending">
            <strong>12:30</strong>&nbsp;Lisinopril
          </div>
          <i className="fas fa-chevron-right vc-time-chevron" />
          <div className="vc-time-chip done">
            <strong>18:00</strong>&nbsp;Metformin
          </div>
        </div>
        <div className="vc-dock-divider" />
        <button
          className="vc-sos-btn"
          onClick={() => alert('🚨 Emergency SOS triggered! Simulated call to caregiver.')}
        >
          <i className="fas fa-phone-alt" /> SOS
        </button>
      </div>

      {/* ---- Voice Hint ---- */}
      <div className="vc-voice-hint" style={{ color: isListening ? '#4f46e5' : undefined }}>
        <span className="vc-status-dot" />
        <i className="fas fa-microphone" />
        <span>{voiceHint}</span>
      </div>
    </div>
  );
}

export default LandingPage;
