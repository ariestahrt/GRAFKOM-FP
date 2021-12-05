import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';

/* ========================================================================
    START ::: GENERATE NEW MAP PIECE
======================================================================== */

/* ========================================================================
    END ::: GENERATE NEW MAP PIECE
======================================================================== */

class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
        this.minDif = minDif;
    }

    get min() {
        return this.obj[this.minProp];
    }

    set min(v) {
        this.obj[this.minProp] = v;
        this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }

    get max() {
        return this.obj[this.maxProp];
    }

    set max(v) {
        this.obj[this.maxProp] = v;
        this.min = this.min;  // this will call the min setter
    }
}

function animate () {
    let objects = [];
    let light_objects = {
        DirectionalLight: {
            active: true,
            members: []
        },
        HemisphereLight: {
            active: false,
            members: []
        },
        AmbientLight: {
            active: false,
            members: []
        },
        PointLight: {
            active: false,
            members: []
        },
        Spotlights: {
            active: false,
            members: []
        }
    };

    function generateRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '0x';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return parseInt(color, 16);
    }

    // Setup the camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera( fov, aspect , near, far );
    camera.position.set(0, 25, 25);

    let canvas = document.querySelector('#canvas');
    const renderer = new THREE.WebGLRenderer({
        canvas,
        logarithmicDepthBuffer: true,
        antialias: true,
        powerPreference: "high-performance",
        alpha: false
    });

    renderer.setPixelRatio( window.devicePixelRatio );

    // renderer.setSize( window.innerWidth, window.innerHeight );
    // document.body.appendChild( renderer.domElement );

    function updateCamera() {
        camera.updateProjectionMatrix();
    }

    // SET UI CONTROLNYA
    const gui = new GUI();
    gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
    gui.add(minMaxGUIHelper, 'max', 0.1, 1000, 0.1).name('far').onChange(updateCamera);
    
    let lightBarProps = {
        DirectionalLight: true,
        HemisphereLight:false,
        AmbientLight:false,
        PointLight:false,
        Spotlights:false,
    }

    let DirectionalLight_TOGGLE = gui.add(lightBarProps,'DirectionalLight').name('DirectionalLight').listen();
    DirectionalLight_TOGGLE.onChange((newValue) => {
        setLight('DirectionalLight', newValue)
    });

    let HemisphereLight_TOGGLE = gui.add(lightBarProps,'HemisphereLight').name('HemisphereLight').listen();
    HemisphereLight_TOGGLE.onChange((newValue) => {
        setLight('HemisphereLight', newValue)
    });

    let AmbientLight_TOGGLE = gui.add(lightBarProps,'AmbientLight').name('AmbientLight').listen();
    AmbientLight_TOGGLE.onChange((newValue) => {
        setLight('AmbientLight', newValue)
    });

    let PointLight_TOGGLE = gui.add(lightBarProps,'PointLight').name('PointLight').listen();
    PointLight_TOGGLE.onChange((newValue) => {
        setLight('PointLight', newValue)
    });

    let Spotlights_TOGGLE = gui.add(lightBarProps,'Spotlights').name('Spotlights').listen();
    Spotlights_TOGGLE.onChange((newValue) => {
        setLight('Spotlights', newValue)
    });

    // SET CAMERA CONTROLNYA
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x21252d);

    function setLight(type, active){
        if(active){
            light_objects[type].members.forEach(light =>  scene.add(light));
        }else{
            light_objects[type].members.forEach(light => scene.remove(light));
            light_objects[type].active = false;
        }
    }

    // Directional Light
    {
        function DirectionalFactory(color, intensity, position){
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(position[0], position[1], position[2]);
            return light;
        }

        light_objects.DirectionalLight.members.push(DirectionalFactory(0xFFFFFF, 0.3, [-25,50,25]));
        light_objects.DirectionalLight.members.push(DirectionalFactory(0xFFFFFF, 0.3, [25,50,25]));
        light_objects.DirectionalLight.members.push(DirectionalFactory(0xFFFFFF, 0.3, [-25,50,-25]));
        light_objects.DirectionalLight.members.push(DirectionalFactory(0xFFFFFF, 0.3, [25,50,-25]));

        light_objects.DirectionalLight.members.push(DirectionalFactory(0xFFFFFF, 0.3, [-30,0,30]));
        light_objects.DirectionalLight.members.push(DirectionalFactory(0xFFFFFF, 0.3, [30,0,30]));
        light_objects.DirectionalLight.members.push(DirectionalFactory(0xFFFFFF, 0.3, [-30,0,-30]));
        light_objects.DirectionalLight.members.push(DirectionalFactory(0xFFFFFF, 0.3, [30,0,-30]));
    }

    // HemisphereLight
    {
        const skyColor = generateRandomColor();  // light blue
        const groundColor = generateRandomColor();  // brownish orange
        const intensity = 1;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        
        light_objects.HemisphereLight.members.push(light);
    }

    // AmbientLight
    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.AmbientLight(color, intensity);
        light_objects.AmbientLight.members.push(light);
    }

    // PointLight
    {
        function PointLightFactory(color, intensity, position){
            const light = new THREE.PointLight(color, intensity);
            light.position.set(position[0], position[1], position[2]);
            return light;
        }

        light_objects.PointLight.members.push(PointLightFactory(0xfcba03, 1, [-25,50,25]));
        light_objects.PointLight.members.push(PointLightFactory(0xc300ff, 1, [25,50,25]));
        light_objects.PointLight.members.push(PointLightFactory(0xffffff, 1, [-25,50,-25]));
        light_objects.PointLight.members.push(PointLightFactory(0xfcba03, 1, [25,50,-25]));

        light_objects.PointLight.members.push(PointLightFactory(generateRandomColor(), 1, [-30,0,30]));
        light_objects.PointLight.members.push(PointLightFactory(generateRandomColor(), 1, [30,0,30]));
        light_objects.PointLight.members.push(PointLightFactory(generateRandomColor(), 1, [-30,0,-30]));
        light_objects.PointLight.members.push(PointLightFactory(generateRandomColor(), 1, [30,0,-30]));
    }

    // Spotlights
    {
        function SpotLightFactory(color, intensity, position, target_pos){
            const light = new THREE.SpotLight(color, intensity);
            light.position.set(position[0], position[1], position[2]);
            light.target.position.set(position[0], position[1], position[2]);
            return light;
        }
        light_objects.Spotlights.members.push(SpotLightFactory(generateRandomColor(), 1, [-25,50,25], [0,0,0]));
        light_objects.Spotlights.members.push(SpotLightFactory(generateRandomColor(), 1, [25,50,25], [0,0,0]));
    }

    setLight('DirectionalLight', true);

    /* ======== buat cube sbg indikasi tempat lampunya ======== */
    const groups = [];
    {
        const geometry = new THREE.BoxGeometry( 1, 1, 1, 3, 3, 3);
        const material = new THREE.MeshPhongMaterial({color: 0xd5eb34});
        let obj = {};
        
        obj.bawah_leftfront = new THREE.Mesh(geometry, material);
        obj.bawah_leftfront.position.set(-30,0,30);

        obj.bawah_rightfront = new THREE.Mesh(geometry, material);
        obj.bawah_rightfront.position.set(30,0,30);
        
        obj.bawah_leftback = new THREE.Mesh(geometry, material);
        obj.bawah_leftback.position.set(-30,0,-30);
        
        obj.bawah_rightback = new THREE.Mesh(geometry, material);
        obj.bawah_rightback.position.set(30,0,-30);
        scene.add(obj.bawah_leftfront);
        scene.add(obj.bawah_rightfront);
        scene.add(obj.bawah_leftback);
        scene.add(obj.bawah_rightback);
    }
    {
        for (let i = 0; i < 8; i++) {
            const color = generateRandomColor();
            const geometry = new THREE.BoxGeometry(50, 20, 50);
            const material = new THREE.MeshPhongMaterial({color: 0x777777});
    
            const group = new THREE.Group();
        
            const lantai = new THREE.Mesh(geometry, material);
            lantai.position.set(0,-10,i ? (-i*50) + 5 : (-i*50));
            group.add(lantai);
            console.log(group);
    
            scene.add(group);
            groups.push(group);
        }
        // objects["lantai"] = lantai;
    }

    /* ========================================================================
        START ::: GENERATE LEVEL
    ======================================================================== */
    function generateChunk() {
        const color = generateRandomColor();
        const geometry = new THREE.BoxGeometry(50, 20, 50);
        const material = new THREE.MeshPhongMaterial({color: 0x777777});

        const group = new THREE.Group();
    
        const lantai = new THREE.Mesh(geometry, material);
        lantai.position.set(0,-10,camera.position.z - 370);
        group.add(lantai);
        console.log(group);

        scene.add(group);
        groups.push(group);
    }
    /* ========================================================================
        END ::: GENERATE LEVEL
    ======================================================================== */
    // lantai.position.y = -1;


    // Primogem di tengah
    const SIDE_LENGTH = 5;
    {
        const geometry = new THREE.BoxGeometry(SIDE_LENGTH, SIDE_LENGTH, SIDE_LENGTH);
        const color = generateRandomColor();
        const material = new THREE.MeshPhongMaterial({color});
        const obj = new THREE.Mesh(geometry, material);
                
        obj.position.set(0,7,0);
        scene.add(obj);

        objects["octahedron"] = obj;
    }


    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    let t = 0;
    let t2 = 0;

    let MOVEMENT_ACTIVE = {
        ROLL_UP: false,
        ROLL_DOWN: false,
        ROLL_LEFT: false,
        UP_PRESSED: false,
        LEFT_PRESSED: false,
        ROLL_RIGHT: false,
        RIGHT_PRESSED: false,
        UP_READY: true
    }


    let acceleration = 0.1;
    let bounce_distance = 20;
    let bottom_position_y = 2;
    let time_step = 0.00001;
    let GLOBAL_TIME_COUNTER = Math.sqrt(bounce_distance * 2 / acceleration);

    let MOVEMENT_TIME = {
        ROLL_UP: null,
        ROLL_UP_X: -1 * Math.sqrt(bounce_distance),
    }

    /*
    // ON KEY UP EVENT LISTENER
    */
    $(document).on('keyup', (event) => {

        if(event.keyCode == 87 || event.keyCode == 32) { // W
            // Gerak ke atas
            console.log("W key pressed");
            MOVEMENT_ACTIVE.UP_PRESSED = false;
        }
        if(event.keyCode == 65) { // A
            // Gerak ke kiri
            MOVEMENT_ACTIVE.LEFT_PRESSED = false;
        }
        if(event.keyCode == 83) { // S
            // Gerak ke bawah
            MOVEMENT_ACTIVE.ROLL_DOWN = true;
        }
        if(event.keyCode == 68) { // D
            // Gerak ke kanan
            MOVEMENT_ACTIVE.RIGHT_PRESSED = false;
        }
    })

    /*
    // ON KEY DOWN EVENT LISTENER
    */
    $(document).on('keydown', (event) => {

        if(event.keyCode == 87 || event.keyCode == 32) { // W
            // Gerak ke atas
            // console.log("W key pressed");
            MOVEMENT_ACTIVE.ROLL_UP = true;
        }
        if(event.keyCode == 65) { // A
            // Gerak ke kiri
            MOVEMENT_ACTIVE.ROLL_LEFT = true;
            MOVEMENT_ACTIVE.LEFT_PRESSED = true;
            // alert("A key pressed"); 
        }
        if(event.keyCode == 83) { // S
            // Gerak ke bawah
            MOVEMENT_ACTIVE.ROLL_DOWN = true;
            alert("S key pressed"); 
        }
        if(event.keyCode == 68) { // D
            // Gerak ke kanan
            MOVEMENT_ACTIVE.ROLL_RIGHT = true;
            MOVEMENT_ACTIVE.RIGHT_PRESSED = true;
            // alert("D key pressed"); 
        }
    })

    
    let rollSpeed = 5;
    let rollRightDeg = 0;
    let rollLeftDeg = 0;
    function render(time) {
        if (resizeRendererToDisplaySize(renderer)) {
            console.log("RESIZED")
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        /* ========================================================================
            START ::: MOVEMENT HANDLER
        ======================================================================== */
        
        if (MOVEMENT_ACTIVE.ROLL_UP) {
            if(MOVEMENT_ACTIVE.UP_READY){
                MOVEMENT_TIME.ROLL_UP_X = -1 * Math.sqrt(bounce_distance);
                MOVEMENT_ACTIVE.UP_READY = false;
            }else{
                objects["octahedron"].position.y = 7 + (-1 * (MOVEMENT_TIME.ROLL_UP_X * MOVEMENT_TIME.ROLL_UP_X) + bounce_distance);
                MOVEMENT_TIME.ROLL_UP_X += acceleration;
                if(MOVEMENT_TIME.ROLL_UP_X >= Math.sqrt(bounce_distance)){
                    MOVEMENT_ACTIVE.ROLL_UP = false;
                    MOVEMENT_ACTIVE.UP_PRESSED = false;
                    MOVEMENT_ACTIVE.UP_READY = true;
                }
            }
        }

        if(MOVEMENT_ACTIVE.ROLL_LEFT) {
            objects["octahedron"].rotation.z = (rollLeftDeg * Math.PI / 180);
            objects["octahedron"].position.x -= rollSpeed/20;
            if(rollLeftDeg % 90 === 0 && !MOVEMENT_ACTIVE.LEFT_PRESSED) {
                rollLeftDeg = 0;
                MOVEMENT_ACTIVE.ROLL_LEFT = false;
            }
            rollLeftDeg += rollSpeed;
        }
        
        if(MOVEMENT_ACTIVE.ROLL_RIGHT) {
            objects["octahedron"].rotation.z = -(rollRightDeg * Math.PI / 180);
            objects["octahedron"].position.x += rollSpeed/20;
            if(rollRightDeg % 90 === 0 && !MOVEMENT_ACTIVE.RIGHT_PRESSED) {
                rollRightDeg = 0;
                MOVEMENT_ACTIVE.ROLL_RIGHT = false;
            }
            rollRightDeg += rollSpeed;
        }

        /* ========================================================================
            END ::: MOVEMENT HANDLER
        ======================================================================== */
        controls.target.set(objects["octahedron"].position.x, objects["octahedron"].position.y, objects["octahedron"].position.z);
        camera.position.set(objects["octahedron"].position.x, objects["octahedron"].position.y + 20, objects["octahedron"].position.z +25);
        t += 0.01;
        t2 += 0.05;
        
        groups.forEach((group, index) => {
            group.children[0].position.z += rollSpeed/5;
            if (group.children[0].position.z - 25 > camera.position.z) {
                scene.remove(group);
                groups.splice(index, 1);
                generateChunk();
            }
            
        })

        renderer.render( scene, camera );
        requestAnimationFrame( render );
    }
    
    requestAnimationFrame( render );
};

animate();