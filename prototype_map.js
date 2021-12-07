import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';

// console.log = () => {}

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

function randomBetween(min,max){
    let random = (Math.random()*(max-min+1)+min);
    if (random > max){ return max-1}
    else { return random}
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
    camera.position.set(0, 20, 25);

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

    // buat cube sbg indikasi tempat lampunya
    {
        const geometry = new THREE.BoxGeometry( 1, 1, 1, 3, 3, 3);
        // const color = generateRandomColor();
        const material = new THREE.MeshPhongMaterial({color: 0xd5eb34});
        
        let obj = {};
        obj.atas_leftfront = new THREE.Mesh(geometry, material);
        obj.atas_leftfront.position.set(-25,50,25);
        
        obj.atas_rightfront = new THREE.Mesh(geometry, material);
        obj.atas_rightfront.position.set(25,50,25);
        
        obj.atas_leftback = new THREE.Mesh(geometry, material);
        obj.atas_leftback.position.set(-25,50,-25);
        
        obj.atas_rightback = new THREE.Mesh(geometry, material);
        obj.atas_rightback.position.set(25,50,-25);
        
        obj.bawah_leftfront = new THREE.Mesh(geometry, material);
        obj.bawah_leftfront.position.set(-30,0,30);

        obj.bawah_rightfront = new THREE.Mesh(geometry, material);
        obj.bawah_rightfront.position.set(30,0,30);
        
        obj.bawah_leftback = new THREE.Mesh(geometry, material);
        obj.bawah_leftback.position.set(-30,0,-30);
        
        obj.bawah_rightback = new THREE.Mesh(geometry, material);
        obj.bawah_rightback.position.set(30,0,-30);

        
        // scene.add(obj.atas_leftfront);
        // scene.add(obj.atas_rightfront);
        // scene.add(obj.atas_leftback);
        // scene.add(obj.atas_rightback);

        // scene.add(obj.bawah_leftfront);
        // scene.add(obj.bawah_rightfront);
        // scene.add(obj.bawah_leftback);
        // scene.add(obj.bawah_rightback);
    }
    
    // Lantai-nya
    {
        const planeSize = 40;
    
        const loader = new THREE.TextureLoader();
        const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 2;
        texture.repeat.set(repeats, repeats);
    
        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
          map: texture,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = Math.PI * -.5;
        scene.add(mesh);
    }

    const makeTiles = (x_adjustment, y_adjustment, z_adjustment) => {
        let this_obj = [];
        // Tiles Factory
        {
            const geometry = new THREE.BoxGeometry(15, 1, 50);
            const material = new THREE.MeshPhongMaterial({color: 0x313A42 });
            const obj = new THREE.Mesh(geometry, material);
                    
            obj.position.set(0 + x_adjustment,0 + y_adjustment,0 + z_adjustment);
            obj.name = "KOTAK";
            
            this_obj.push(obj);
            scene.add(obj);
            // Buat stik di kanan
            {
                const geometry = new THREE.BoxGeometry(1, 0.5, 50);
                const material = new THREE.MeshPhongMaterial({color: 0xC6B9AE});
                const obj = new THREE.Mesh(geometry, material);
                        
                obj.position.set(0+7.5/2 + x_adjustment,1+0.5 + y_adjustment,0 + z_adjustment);
                obj.name = "STIK_KANAN";
                this_obj.push(obj);
                scene.add(obj);
            }
            // Buat stik di kiri
            {
                const geometry = new THREE.BoxGeometry(1, 0.5, 50);
                const material = new THREE.MeshPhongMaterial({color: 0xC6B9AE});
                const obj = new THREE.Mesh(geometry, material);
                        
                obj.position.set(0 - 7.5/2 + x_adjustment,1+0.5+ y_adjustment,0+ z_adjustment);
                obj.name = "STIK_KIRI";
                this_obj.push(obj);
                scene.add(obj);
            }
            // Buat rel2nya
            for(let i=-2; i<3; i++){
                {
                    const geometry = new THREE.BoxGeometry(12, 0.5, 1);
                    // const color = generateRandomColor();
                    const material = new THREE.MeshPhongMaterial({color:0x7C634F});
                    const obj = new THREE.Mesh(geometry, material);
                            
                    obj.position.set(0 + x_adjustment,1 + y_adjustment,i*10 + z_adjustment);
                    obj.name = "BAWAHAN_REL";
                    this_obj.push(obj);
                    scene.add(obj);
                }
            }
        }
        return this_obj;
    }

    // House Factory::
    const makeHouse = (adjustment) => {
        let height = randomBetween(30, 70);
        let randColor = () => {
            let res = "#"
            let color = 1 + Math.floor(height) % 4;
            for (let i = 0; i < 3; i++) {
                res += "4";
                res += color*2;
            }
            return res
        }
        const geometry = new THREE.BoxGeometry(45, height, 50);
        const color = generateRandomColor();
        const material = new THREE.MeshPhongMaterial({color: randColor()});
        const obj = new THREE.Mesh(geometry, material);
                
        obj.position.set(0 + adjustment.x ,height/2 + adjustment.y, 0 + adjustment.z);
        obj.name = "HOUSE";
        scene.add(obj);
        return obj;
    };

    const makeFullTiles = (adjustment) => {
        let BIG_TILES = [];
        for(let i=-1; i<2; i++){
            BIG_TILES.push(makeTiles(15*i,adjustment.y,-1*adjustment.z));
        }
        
        BIG_TILES[0].push(makeHouse(new THREE.Vector3(45,0,-1*adjustment.z)));
        BIG_TILES[0].push(makeHouse(new THREE.Vector3(-45,0,-1*adjustment.z)));
        
        // Random thing to determine will the palang created? wkwwk
        let roullete = parseInt(randomBetween(0,3));
        // console.log(roullete);
        if(roullete != 1){
            // Create the challenge
            let mid_left_right = parseInt(randomBetween(0,3));
            // console.log("SPAWN DI ", mid_left_right-1)
            BIG_TILES.push(makePalangRendah(new THREE.Vector3((mid_left_right-1) * 15 ,0, -1 * adjustment.z)));
        }

        return BIG_TILES;
    }

    const makePalangRendah = (adjustment) => {
        // Setara level strukturnya dengan MINI_TILES
        let this_obj = [];
        // TIANG KIRI
        {
            const geometry = new THREE.BoxGeometry(1.5, 8, 1);
            const material = new THREE.MeshPhongMaterial({color: 0xC6B9AE});
            const obj = new THREE.Mesh(geometry, material);
    
            obj.position.set(-7.5 + 2 + adjustment.x ,8/2+ 1 + adjustment.y, 0 + adjustment.z);
            obj.name = "TIANG_KIRI";
            scene.add(obj);
            this_obj.push(obj);
        }

        // TIANG KANAN
        {
            const geometry = new THREE.BoxGeometry(1.5, 8, 1);
            const material = new THREE.MeshPhongMaterial({color: 0xC6B9AE});
            const obj = new THREE.Mesh(geometry, material);
    
            obj.position.set(-1*(-7.5 + 2) + adjustment.x ,8/2+1 + adjustment.y, 0 + adjustment.z);
            obj.name = "TIANG_KANAN";
            scene.add(obj);
            this_obj.push(obj);
        }

        // PALANG
        {
            const geometry = new THREE.BoxGeometry(15, 3, 1);
            const material = new THREE.MeshPhongMaterial({color: 0xBC5043});
            const obj = new THREE.Mesh(geometry, material);
    
            obj.position.set(0 + adjustment.x ,3/2+8 + 1 + adjustment.y, 0 + adjustment.z);
            obj.name = "PALANG";
            scene.add(obj);
            this_obj.push(obj);
        }
        return this_obj;
    };

    // makePalangRendah(new THREE.Vector3(0,0,-10));


    // Prototype Player
    {
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const color = generateRandomColor();
        const material = new THREE.MeshPhongMaterial({color});
        const obj = new THREE.Mesh(geometry, material);
                
        obj.position.set(0,7,0);
        obj.name = "PLAYER";
        scene.add(obj);
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
        ROLL_RIGHT: false,
        UP_PRESSED: false,
        DOWN_PRESSED: false,
        LEFT_PRESSED: false,
        RIGHT_PRESSED: false,
        UP_READY: true,
        DOWN_READY: true,
        POSITION: 0
    }


    let acceleration = 0.1;
    let bounce_distance = 20;
    let bottom_position_y = 2;
    let time_step = 0.00001;
    let GLOBAL_TIME_COUNTER = Math.sqrt(bounce_distance * 2 / acceleration);

    let MOVEMENT_TIME = {
        ROLL_UP: null,
        ROLL_UP_X: -1 * Math.sqrt(bounce_distance),
        ROLL_DOWN: null,
        ROLL_DOWN_X: -1 * Math.sqrt(bounce_distance),
    }

    /*
    // ON KEY UP EVENT LISTENER
    */
    $(document).on('keyup', (event) => {

        if(event.keyCode == 87 || event.keyCode == 32) { // W
            // Gerak ke atas
            // console.log("W key pressed");
            MOVEMENT_ACTIVE.UP_PRESSED = false;
        }
        if(event.keyCode == 65) { // A
            // Gerak ke kiri
            MOVEMENT_ACTIVE.LEFT_PRESSED = false;
        }
        if(event.keyCode == 83) { // S
            // Gerak ke bawah
            MOVEMENT_ACTIVE.DOWN_PRESSED = false;
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
            if(!MOVEMENT_ACTIVE.ROLL_DOWN) {
                MOVEMENT_ACTIVE.ROLL_UP = true;
            }
        }
        if(event.keyCode == 65) { // A
            // Gerak ke kiri
            MOVEMENT_ACTIVE.ROLL_LEFT = true;
            MOVEMENT_ACTIVE.LEFT_PRESSED = true;
        }
        if(event.keyCode == 83) { // S
            // Gerak ke bawah
            if(!MOVEMENT_ACTIVE.ROLL_UP) {
                MOVEMENT_ACTIVE.ROLL_DOWN = true;
            }
        }
        if(event.keyCode == 68) { // D
            // Gerak ke kanan
            MOVEMENT_ACTIVE.ROLL_RIGHT = true;
            MOVEMENT_ACTIVE.RIGHT_PRESSED = true;
        }
    })

    function moveCamera(PLAYER_OBJ) {
        // return;
        camera.position.x = PLAYER_OBJ.position.x;
        camera.position.y = PLAYER_OBJ.position.y + 15;
        camera.lookAt(PLAYER_OBJ.position);
    }
    
    let rollSpeed = 10;
    let rollRightDeg = 0;
    let rollLeftDeg = 0;
    let time = 0;

    // MAIN FUNCTION HERE
    
    let MOVING_OBJECT = [];

    // INITIATE TILES
    for(let i=0; i<10; i++){
        MOVING_OBJECT.push(makeFullTiles(new THREE.Vector3(0, 0, i*50)));
    }
    function render() {
        let PLAYER_OBJ = scene.getObjectByName("PLAYER", true);
        PLAYER_OBJ.position.y = PLAYER_OBJ.position.y + (Math.sin(time*2)/10);
        if (resizeRendererToDisplaySize(renderer)) {
            // console.log("RESIZED")
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        
        // console.log("🚀 ~ file: prototype_map.js ~ line 571 ~ render ~ PLAYER_OBJ", PLAYER_OBJ)
        if (MOVEMENT_ACTIVE.POSITION === -1 && PLAYER_OBJ.position.x > -15) {
            PLAYER_OBJ.rotation.z = (rollLeftDeg * Math.PI / 180);
            PLAYER_OBJ.position.x -= rollSpeed/20;
        } else if (MOVEMENT_ACTIVE.POSITION === 1 && PLAYER_OBJ.position.x < 15) {
            PLAYER_OBJ.rotation.z = -(rollRightDeg * Math.PI / 180);
            PLAYER_OBJ.position.x += rollSpeed/20;
        } else if (MOVEMENT_ACTIVE.POSITION === 0 && PLAYER_OBJ.position.x < 0) {
            PLAYER_OBJ.rotation.z = -(rollRightDeg * Math.PI / 180);
            PLAYER_OBJ.position.x += rollSpeed/20;
        } else if (MOVEMENT_ACTIVE.POSITION === 0 && PLAYER_OBJ.position.x > 0) {
            PLAYER_OBJ.rotation.z = (rollLeftDeg * Math.PI / 180);
            PLAYER_OBJ.position.x -= rollSpeed/20;
        }

        /* ======== JUMPING ======== */
        if (MOVEMENT_ACTIVE.ROLL_UP) {
            if(MOVEMENT_ACTIVE.UP_READY){
                MOVEMENT_TIME.ROLL_UP_X = -1 * Math.sqrt(bounce_distance);
                MOVEMENT_ACTIVE.UP_READY = false;
                MOVEMENT_ACTIVE.DOWN_READY = false;
                console.log("🚀 ~ file: prototype_map.js ~ line 591 ~ render ~ MOVEMENT_ACTIVE.ROLL_UP", MOVEMENT_ACTIVE.ROLL_UP)
                console.log("🚀 ~ file: prototype_map.js ~ line 591 ~ render ~ MOVEMENT_ACTIVE.ROLL_DOWN", MOVEMENT_ACTIVE.ROLL_DOWN)
            } else if (!MOVEMENT_ACTIVE.ROLL_DOWN){
                PLAYER_OBJ.position.y = 7 + (-1 * (MOVEMENT_TIME.ROLL_UP_X * MOVEMENT_TIME.ROLL_UP_X) + bounce_distance);
                PLAYER_OBJ.scale.y = 1 + (-1 * (MOVEMENT_TIME.ROLL_UP_X * MOVEMENT_TIME.ROLL_UP_X) + bounce_distance) / 40;
                MOVEMENT_TIME.ROLL_UP_X += acceleration;
                if(MOVEMENT_TIME.ROLL_UP_X >= Math.sqrt(bounce_distance)){
                    PLAYER_OBJ.scale.y = 1;
                    MOVEMENT_ACTIVE.ROLL_UP = false;
                    MOVEMENT_ACTIVE.UP_PRESSED = false;
                    MOVEMENT_ACTIVE.UP_READY = true;
                    MOVEMENT_ACTIVE.DOWN_READY = true;
                }
            }
        }

        /* ======== DUCKING ======== */
        if (MOVEMENT_ACTIVE.ROLL_DOWN) {
            if(MOVEMENT_ACTIVE.DOWN_READY){
                MOVEMENT_TIME.ROLL_DOWN_X = -1 * Math.sqrt(bounce_distance);
                MOVEMENT_ACTIVE.UP_READY = false;
                MOVEMENT_ACTIVE.DOWN_READY = false;
            } else if (!MOVEMENT_ACTIVE.ROLL_UP){
                PLAYER_OBJ.scale.y = 1 - (-1 * (MOVEMENT_TIME.ROLL_DOWN_X * MOVEMENT_TIME.ROLL_DOWN_X) + bounce_distance) / 30;
                PLAYER_OBJ.scale.z = 1 + (-1 * (MOVEMENT_TIME.ROLL_DOWN_X * MOVEMENT_TIME.ROLL_DOWN_X) + bounce_distance) / 30;
                MOVEMENT_TIME.ROLL_DOWN_X += acceleration;
                if(MOVEMENT_TIME.ROLL_DOWN_X >= Math.sqrt(bounce_distance)){
                    PLAYER_OBJ.scale.y = 1;
                    MOVEMENT_ACTIVE.ROLL_DOWN = false;
                    MOVEMENT_ACTIVE.DOWN_PRESSED = false;
                    MOVEMENT_ACTIVE.DOWN_READY = true;
                    MOVEMENT_ACTIVE.UP_READY = true;
                }
            }
        }

        /* ======== MOVE LEFT ======== */
        if(MOVEMENT_ACTIVE.ROLL_LEFT) {
            if(MOVEMENT_ACTIVE.POSITION > -1) MOVEMENT_ACTIVE.POSITION -= 1;
            MOVEMENT_ACTIVE.ROLL_LEFT = false;
        }
        
        /* ======== MOVE RIGHT ======== */
        if(MOVEMENT_ACTIVE.ROLL_RIGHT) {
            if(MOVEMENT_ACTIVE.POSITION < 1) MOVEMENT_ACTIVE.POSITION += 1;
            MOVEMENT_ACTIVE.ROLL_RIGHT = false;
        }

        // Animate the moving object
        MOVING_OBJECT.forEach((BIG_TILES) => {
            // return;
            let removeornot = false;
            BIG_TILES.forEach((MINI_TILES) => {
                MINI_TILES.forEach((object) =>{
                    object.position.z += rollSpeed/10;
                    if(object.name === "KOTAK" && object.position.z >= 50){
                        removeornot = true;
                    }
                })
            })

            if(removeornot == true){
                BIG_TILES.forEach((MINI_TILES) => {
                    MINI_TILES.forEach((object) =>{
                        scene.remove(object);
                        // object.dispose();
                    })
                })
                // Also remove BIG_TILES from MOVING OBJECT               
                MOVING_OBJECT.shift();
                // Then add New BIG_TILES to MOVING OBJECT
                MOVING_OBJECT.push(makeFullTiles(new THREE.Vector3(0, 0, (10-1)*50 )));
            }
        });

        moveCamera(PLAYER_OBJ);

        // PLAYER_OBJ.rotation.y += 0.003;

        t += 0.01;
        t2 += 0.05;
        time += 0.1;
        renderer.render( scene, camera );
        requestAnimationFrame( render );
    }
    
    requestAnimationFrame( render );
};

animate();