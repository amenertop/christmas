// 全局变量
let audioContext, analyser, dataArray;
let isPlaying = false;

// 初始化切换按钮
function initToggleButton() {
    const toggleCard = document.querySelector('.toggle-card');
    const container = document.querySelector('.container');
    let isCardVisible = true;

    if (!toggleCard || !container) {
        console.error('Toggle button or container not found');
        return;
    }

    function toggleCardVisibility() {
        isCardVisible = !isCardVisible;
        container.classList.toggle('collapsed');
        toggleCard.classList.toggle('collapsed');
        
        // 更新图标
        const toggleIcon = toggleCard.querySelector('.toggle-icon');
        if (toggleIcon) {
            toggleIcon.textContent = isCardVisible ? '👈' : '👉';
        }
    }

    // 添加点击事件监听
    toggleCard.addEventListener('click', toggleCardVisibility);
}

// 音频控制
function initAudioControl() {
    const bgMusic = document.getElementById('bgMusic');
    const musicControl = document.querySelector('.music-control');

    function toggleMusic() {
        if (isPlaying) {
            bgMusic.pause();
            document.querySelector('.music-waves').style.display = 'none';
        } else {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaElementSource(bgMusic);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                analyser.fftSize = 256;
                dataArray = new Uint8Array(analyser.frequencyBinCount);
            }
            bgMusic.play().catch(() => {
                console.log('Audio autoplay was prevented');
            });
            document.querySelector('.music-waves').style.display = 'block';
        }
        isPlaying = !isPlaying;
    }

    if (musicControl) {
        musicControl.addEventListener('click', toggleMusic);
    }
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 初始化切换按钮
    const toggleCard = document.querySelector('.toggle-card');
    const container = document.querySelector('.container');
    let isCardVisible = true;

    if (toggleCard && container) {
        toggleCard.addEventListener('click', () => {
            isCardVisible = !isCardVisible;
            if (isCardVisible) {
                container.style.transform = 'translate(-50%, -50%)';
                container.style.opacity = '1';
                toggleCard.querySelector('.toggle-icon').textContent = '👈';
            } else {
                container.style.transform = 'translate(100%, -50%)';
                container.style.opacity = '0';
                toggleCard.querySelector('.toggle-icon').textContent = '👉';
            }
        });
    }

    // 初始化音频控制
    initAudioControl();

    // 初始化加载状态
    let assetsLoaded = false;
    let sceneInitialized = false;

    // 初始化Three.js场景
    function initScene() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('scene'),
            alpha: true,
            antialias: true
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 创建圣诞树粒子系统
        function createChristmasTree() {
            const particlesGeometry = new THREE.BufferGeometry();
            const particlesCnt = window.innerWidth < 768 ? 2000000 : 4000000; // 增加粒子数量
            const posArray = new Float32Array(particlesCnt * 3);
            const colors = new Float32Array(particlesCnt * 3);
            const sizes = new Float32Array(particlesCnt);

            // 树干
            const trunkParticles = Math.floor(particlesCnt * 0.06); // 减少树干比例
            for(let i = 0; i < trunkParticles * 3; i += 3) {
                const height = Math.random() * 2.5; // 减小树干高度
                // 优化树干形状
                const baseRadius = 0.25; // 减小树干半径
                const topRadius = 0.15;
                const radius = baseRadius - Math.pow(height / 2.5, 1.5) * (baseRadius - topRadius);
                const angle = Math.random() * Math.PI * 2;
                
                // 增强树干纹理
                const barkRings = 80; // 增加环形纹理
                const ringIndex = Math.floor(height * barkRings);
                const ringAngle = (ringIndex / barkRings) * Math.PI * 2;
                const verticalDetail = Math.sin(height * 50) * 0.01 + Math.sin(height * 25) * 0.005;
                const ringDetail = Math.sin(angle * 16) * 0.01 + Math.cos(angle * 8) * 0.005;
                const spiralDetail = Math.sin(height * 15 + angle * 6) * 0.01;
                const barkNoise = (Math.random() - 0.5) * 0.005;
                
                posArray[i] = Math.cos(angle) * (radius + verticalDetail + ringDetail + spiralDetail + barkNoise);
                posArray[i + 1] = height - 2.5; // 调整树干位置
                posArray[i + 2] = Math.sin(angle) * (radius + verticalDetail + ringDetail + spiralDetail + barkNoise);

                // 优化树干颜色
                const barkShade = 0.2 + Math.random() * 0.1;
                const heightShade = Math.sin(height * 15) * 0.05;
                const ringShade = Math.sin(ringAngle * 10) * 0.03;
                colors[i] = barkShade * 0.5 + heightShade;     // R
                colors[i + 1] = barkShade * 0.3 + ringShade;  // G
                colors[i + 2] = barkShade * 0.1;              // B

                sizes[i / 3] = 0.006 + Math.random() * 0.003; // 减小树干粒子大小
            }

            // 树冠
            const layerCount = 60; // 增加层数
            const branchesPerLayer = 96; // 增加分支数
            for(let i = trunkParticles * 3; i < particlesCnt * 3; i += 3) {
                const layer = Math.floor((Math.random() * layerCount));
                const layerHeight = layer / layerCount;
                
                // 优化树冠形状
                const shapeExponent = 1.2; // 调整形状曲线，使其更尖锐
                const treeShape = Math.pow(1 - layerHeight, shapeExponent);
                const maxRadius = 3.2 * treeShape; // 减小树冠半径
                const minRadius = layer * 0.03;
                
                // 增强分层效果
                const layerThickness = 0.12 * (1 - layerHeight * 0.6); // 上层更薄
                const radiusVariation = Math.random() * layerThickness;
                let radius = minRadius + (maxRadius - minRadius) * (1 - Math.pow(radiusVariation, 1.3));
                
                // 优化自然曲线
                const curve = Math.sin(layerHeight * Math.PI) * 0.2 + Math.sin(layerHeight * Math.PI * 3) * 0.08;
                radius *= (1 + curve);
                
                // 增强分支系统
                const branchIndex = Math.floor(Math.random() * branchesPerLayer);
                const mainAngle = (branchIndex / branchesPerLayer) * Math.PI * 2;
                const subBranchCount = 5; // 增加子分支
                const subBranchIndex = Math.floor(Math.random() * subBranchCount);
                const subBranchAngle = (subBranchIndex / subBranchCount) * (Math.PI / branchesPerLayer * 1.5);
                const angle = mainAngle + subBranchAngle;
                
                // 优化随机偏移
                const randomOffset = {
                    x: (Math.random() - 0.5) * 0.06 * treeShape * (1 + layerHeight),
                    y: (Math.random() - 0.5) * 0.03 * (1 - layerHeight),
                    z: (Math.random() - 0.5) * 0.06 * treeShape * (1 + layerHeight)
                };
                
                // 增强枝条细节
                const branchDetail = Math.sin(angle * 32) * 0.04 * treeShape;
                const subBranchDetail = Math.cos(layerHeight * 60) * 0.02;
                const spiralDetail = Math.sin(layerHeight * 25 + angle * 8) * 0.03 * treeShape;
                const layerNoise = (Math.random() - 0.5) * 0.015 * treeShape;
                
                // 最终位置计算
                posArray[i] = (Math.cos(angle) * radius + branchDetail + spiralDetail) + randomOffset.x + layerNoise;
                posArray[i + 1] = layerHeight * 6 + randomOffset.y + subBranchDetail; // 减小树高
                posArray[i + 2] = (Math.sin(angle) * radius + branchDetail + spiralDetail) + randomOffset.z + layerNoise;

                // 优化粒子大小
                const heightFactor = 1 - (layerHeight * 0.2);
                const edgeFactor = Math.pow(radius / maxRadius, 0.7);
                const sizeFactor = Math.pow(1 - layerHeight, 0.4);
                sizes[i / 3] = (0.008 + Math.random() * 0.004) * heightFactor * edgeFactor * sizeFactor;

                // 增强颜色系统
                const colorType = Math.random();
                if(colorType > 0.996) { // 金色装饰
                    colors[i] = 1;       // R
                    colors[i + 1] = 0.9; // G
                    colors[i + 2] = 0.1;  // B
                    sizes[i / 3] *= 3;
                } else if(colorType > 0.992) { // 红色装饰
                    colors[i] = 1;     // R
                    colors[i + 1] = 0; // G
                    colors[i + 2] = 0; // B
                    sizes[i / 3] *= 3;
                } else if(colorType > 0.988) { // 白色装饰
                    colors[i] = 1;     // R
                    colors[i + 1] = 1; // G
                    colors[i + 2] = 1; // B
                    sizes[i / 3] *= 2.5;
                } else if(colorType > 0.984) { // 蓝色装饰
                    colors[i] = 0.2;   // R
                    colors[i + 1] = 0.4; // G
                    colors[i + 2] = 1;   // B
                    sizes[i / 3] *= 2.5;
                } else if(colorType > 0.98) { // 紫色装饰
                    colors[i] = 0.8;   // R
                    colors[i + 1] = 0.2; // G
                    colors[i + 2] = 0.8; // B
                    sizes[i / 3] *= 2.5;
                } else { // 绿色主体
                    const heightVariation = Math.pow(layerHeight, 0.8);
                    const greenBase = 0.25 + Math.random() * 0.1;
                    const greenVariation = Math.sin(layerHeight * Math.PI) * 0.08;
                    const edgeVariation = Math.pow(radius / maxRadius, 0.5) * 0.1;
                    const angleVariation = Math.sin(angle * branchesPerLayer * 0.5) * 0.04;
                    colors[i] = 0.03 + greenVariation * 0.06;        // R
                    colors[i + 1] = greenBase + greenVariation - heightVariation * 0.1 + edgeVariation + angleVariation; // G
                    colors[i + 2] = 0.03 + greenVariation * 0.06;    // B
                }
            }

            // 星星
            const starParticles = 2000;
            const starOffset = particlesCnt * 3 - starParticles * 3;
            for(let i = 0; i < starParticles * 3; i += 3) {
                const starLayer = Math.floor(i / (starParticles * 0.1));
                const layerAngle = (i / 3) * (Math.PI * 2 / (starParticles / 15));
                const radius = 0.4 - (starLayer * 0.03);
                
                // 优化星形图案
                const starPoints = 5;
                const starAngle = layerAngle + Math.PI / starPoints;
                const starPhase = Math.floor(starAngle * starPoints / (Math.PI * 2));
                const pointSharpness = 0.5;
                const starRadius = radius * (1 + Math.pow(Math.abs(Math.sin(starAngle * starPoints)), pointSharpness));
                
                posArray[starOffset + i] = Math.cos(layerAngle) * starRadius * 0.5;
                posArray[starOffset + i + 1] = 6.3 - (starLayer * 0.04);
                posArray[starOffset + i + 2] = Math.sin(layerAngle) * starRadius * 0.5;

                // 优化星星发光效果
                const starBrightness = 0.99 + Math.random() * 0.01;
                const pulseEffect = Math.sin(layerAngle * 15 + performance.now() * 0.001) * 0.06;
                const layerEffect = Math.cos(starLayer * 0.6) * 0.04;
                colors[starOffset + i] = 1 * starBrightness + pulseEffect + layerEffect;     // R
                colors[starOffset + i + 1] = 0.98 * starBrightness + pulseEffect + layerEffect; // G
                colors[starOffset + i + 2] = 0.7 * starBrightness + pulseEffect + layerEffect;   // B

                sizes[Math.floor((starOffset + i) / 3)] = 0.05 - (starLayer * 0.002);
            }

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const particlesMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    mousePosition: { value: new THREE.Vector2(0, 0) }
                },
                vertexShader: `
                    uniform float time;
                    uniform vec2 mousePosition;
                    attribute float size;
                    varying vec3 vColor;
                    varying float vAlpha;
                    
                    void main() {
                        vColor = color;
                        vec3 pos = position;
                        
                        // 整体呼吸效果
                        float globalBreath = sin(time * 0.8) * 0.03;
                        
                        // 分层呼吸效果
                        float layerBreath = sin(time * 1.2 + pos.y * 2.0) * 0.02;
                        
                        // 枝条摆动效果
                        float branchWave = sin(time * 2.0 + pos.x * 3.0 + pos.z * 3.0) * 0.015 * (1.0 - pos.y * 0.1);
                        
                        // 装饰品闪烁效果
                        float decorationPulse = sin(time * 3.0 + pos.x * 10.0 + pos.z * 10.0) * 0.01;
                        
                        // 组合所有效果
                        pos *= 1.0 + globalBreath;
                        pos.x += branchWave * (pos.y + 3.0);
                        pos.z += branchWave * (pos.y + 3.0);
                        pos.y += layerBreath * (pos.y + 3.0) + decorationPulse;
                        
                        // 鼠标交互效果
                        float dist = length(mousePosition - vec2(pos.x, pos.z));
                        float influence = smoothstep(2.0, 0.0, dist);
                        pos.y += influence * 0.2 * (1.0 + sin(time * 3.0) * 0.3);
                        
                        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                        
                        // 动态粒子大小
                        float sizeBreath = 1.0 + sin(time * 2.0 + pos.y * 4.0) * 0.2;
                        float distanceScale = 300.0 / -mvPosition.z;
                        gl_PointSize = size * sizeBreath * distanceScale;
                        
                        // 动态透明度
                        float alphaBreath = sin(time * 1.5 + pos.y * 2.0) * 0.15;
                        vAlpha = 0.8 + alphaBreath;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    varying float vAlpha;
                    
                    void main() {
                        float dist = length(gl_PointCoord - vec2(0.5));
                        if (dist > 0.5) discard;
                        
                        // 增强发光效果
                        float glow = pow(1.0 - dist * 2.0, 2.0);
                        vec3 color = vColor * (1.0 + glow * 0.8);
                        
                        // 柔和边缘
                        float edge = smoothstep(0.5, 0.2, dist);
                        
                        gl_FragColor = vec4(color, vAlpha * edge * glow);
                    }
                `,
                transparent: true,
                vertexColors: true,
                blending: THREE.AdditiveBlending
            });

            return new THREE.Points(particlesGeometry, particlesMaterial);
        }

        const christmasTree = createChristmasTree();
        scene.add(christmasTree);

        // 添加环境光和点光���
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const lights = [];
        const lightColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
        for(let i = 0; i < 4; i++) {
            const light = new THREE.PointLight(lightColors[i], 0.5);
            const angle = (i / 4) * Math.PI * 2;
            light.position.set(Math.cos(angle) * 5, 2, Math.sin(angle) * 5);
            scene.add(light);
            lights.push(light);
        }

        // 设置相机位置
        camera.position.set(0, 2, 8);
        camera.lookAt(0, 0, 0);

        // 添加轨道控制
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.minDistance = 5;
        controls.maxDistance = 15;
        controls.minPolarAngle = Math.PI / 4; // 限制垂直旋转角度
        controls.maxPolarAngle = Math.PI / 2;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        // 音频控制
        const bgMusic = document.getElementById('bgMusic');
        let isPlaying = false;

        function toggleMusic() {
            if (isPlaying) {
                bgMusic.pause();
                document.querySelector('.music-waves').style.display = 'none';
            } else {
                bgMusic.play().catch(() => {
                    console.log('Audio autoplay was prevented');
                });
                document.querySelector('.music-waves').style.display = 'block';
            }
            isPlaying = !isPlaying;
        }

        // 音频可视化
        let audioContext, analyser, dataArray;
        function initAudioVisualizer() {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(bgMusic);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        // 处理音频自动播放
        function initAudio() {
            document.addEventListener('click', () => {
                if (!isPlaying) {
                    if (!audioContext) initAudioVisualizer();
                    toggleMusic();
                }
            }, { once: true });
        }

        // 鼠标位置
        const mouse = new THREE.Vector2();
        function updateMousePosition(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            if (christmasTree.material.uniforms) {
                christmasTree.material.uniforms.mousePosition.value.set(mouse.x, mouse.y);
            }
        }

        // 动画循环
        function animate() {
            requestAnimationFrame(animate);
            
            // 更新控制器
            controls.update();
            
            // 更新着色器时间
            if (christmasTree.material.uniforms) {
                christmasTree.material.uniforms.time.value = performance.now() * 0.001;
            }

            // 渲染场景
            renderer.render(scene, camera);
        }

        // 开始动画循环
        animate();

        // 响应窗口大小变化
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }

        // 事件监听
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('mousemove', updateMousePosition);
        document.querySelector('.music-control').addEventListener('click', toggleMusic);

        // 标记场景初始化完成
        sceneInitialized = true;
        checkLoadingComplete();
    }

    // 检查是否所有资源都已加载
    function checkLoadingComplete() {
        if (assetsLoaded && sceneInitialized) {
            // 隐藏加载动画
            gsap.to('.loading', {
                opacity: 0,
                duration: 1,
                onComplete: () => {
                    document.querySelector('.loading').style.display = 'none';
                }
            });

            // 显示主内容
            gsap.from('.container', {
                opacity: 0,
                y: 50,
                duration: 1,
                delay: 0.5
            });

            // 初始化音频
            initAudio();
        }
    }

    // 加载所有资源
    function loadAssets() {
        const totalAssets = 1; // 更新为实际需要加载的资源数量
        let loadedAssets = 0;

        // 加载音频
        const bgMusic = document.getElementById('bgMusic');
        bgMusic.addEventListener('canplaythrough', () => {
            loadedAssets++;
            if (loadedAssets === totalAssets) {
                assetsLoaded = true;
                checkLoadingComplete();
            }
        });

        // 这里可以添加其他资��的加载
    }

    // 开始加载
    loadAssets();
    initScene();
}); 