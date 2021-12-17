// import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

// console.log = () => {}

let GLOBAL_COIN = 0;
let GLOBAL_STATE = "IDLE";
let GLOBAL_RAF = {
    speed: 10,
};

let audio_soundtrack = new Audio('resources/audio/soundtrack.mp3');


const last = (obj, pos=-1) => {
    return obj[obj.length + pos];
}

class BasicCharacterControllerProxy {
    constructor(animations) {
      this._animations = animations;
    }
  
    get animations() {
      return this._animations;
    }
};


class BasicCharacterController {
    constructor(params, player_hit_box, rollSpeed) {
        this.PLAYER_HIT_BOX = player_hit_box;
        this.rollSpeed = rollSpeed;
        this._Init(params);
    }

    setRollSpeed(val){
        this.rollSpeed = val;
        this.acceleration = this.rollSpeed/(25/0.3);
    }
  
    _Init(params) {
        this.acceleration = this.rollSpeed/(25/0.3);
        this.bounce_distance = 20;
    
        this.MOVEMENT_TIME = {
            ROLL_UP: null,
            ROLL_UP_X: -1 * Math.sqrt(this.bounce_distance),
            ROLL_DOWN: null,
            ROLL_DOWN_X: -1 * Math.sqrt(this.bounce_distance),
        }

        

        this._params = params;
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
        this._velocity = new THREE.Vector3(0, 0, 0);
    
        this._animations = {};
        this._input = new BasicCharacterControllerInput();
        this._stateMachine = new CharacterFSM(new BasicCharacterControllerProxy(this._animations));
    
        this._LoadModels();
    }
  
    _LoadModels() {
        const loader = new FBXLoader();
        loader.setPath('./resources/zombie/');
        loader.load('aj.fbx', (fbx) => {
            fbx.scale.setScalar(0.07);
            fbx.traverse(c => {
                c.castShadow = true;
            });
    
            this._target = fbx;
            this._params.scene.add(this._target);

            const _Q = new THREE.Quaternion();
            const _A = new THREE.Vector3();
            const _R = this._target.quaternion.clone();

            _A.set(0, 1, 0);
            _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * 0.255);
            _R.multiply(_Q);
            this._target.quaternion.copy(_R);

            console.log(this._target.position);
            this._target.position.x = 0

            this._mixer = new THREE.AnimationMixer(this._target);
    
            this._manager = new THREE.LoadingManager();
            this._manager.onLoad = () => {
            this._stateMachine.SetState('idle');
            };
    
            const _OnLoad = (animName, anim) => {
            const clip = anim.animations[0];
            const action = this._mixer.clipAction(clip);
        
            this._animations[animName] = {
                clip: clip,
                action: action,
            };
            };
    
            const loader = new FBXLoader(this._manager);
            loader.setPath('./resources/zombie/');
            loader.load('walk.fbx', (a) => { _OnLoad('walk', a); });
            loader.load('jump.fbx', (a) => { _OnLoad('jump', a); });
            loader.load('naruto_run.fbx', (a) => { _OnLoad('run', a); });
            loader.load('naruto_run.fbx', (a) => { _OnLoad('idle', a); });
            loader.load('slide.fbx', (a) => { _OnLoad('slide', a); });
            loader.load('dance.fbx', (a) => { _OnLoad('dance', a); });
        });
    }
  
    Update(timeInSeconds) {
        if (!this._target) {
            return;
        }
    
        this._stateMachine.Update(timeInSeconds, this._input);
    
        const velocity = this._velocity;
        const frameDecceleration = new THREE.Vector3(
            velocity.x * this._decceleration.x,
            velocity.y * this._decceleration.y,
            velocity.z * this._decceleration.z
        );
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
            Math.abs(frameDecceleration.z), Math.abs(velocity.z));
    
        velocity.add(frameDecceleration);
    
        const controlObject = this._target;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
    
        const acc = this._acceleration.clone();
        if (this._input._keys.shift) {
            acc.multiplyScalar(2.0);
        }
    
        if (this._stateMachine._currentState.Name == 'dance') {
            acc.multiplyScalar(0.0);
        }
    
        if (this._input._keys.forward) {
            this._input.MOVEMENT_ACTIVE.ROLL_UP = true;
        }

        if (this._input._keys.backward) {
            this._input.MOVEMENT_ACTIVE.ROLL_DOWN = true;
        }
        
        if (this._input.MOVEMENT_ACTIVE.ROLL_LEFT) {
            if(this._input.MOVEMENT_ACTIVE.POSITION > -1) {
                this._input.MOVEMENT_ACTIVE.POSITION -= 1
                this._input.MOVEMENT_ACTIVE.ROLL_LEFT = false
            }         
        }

        if (this._input.MOVEMENT_ACTIVE.ROLL_RIGHT) {
            if(this._input.MOVEMENT_ACTIVE.POSITION < 1) {
                this._input.MOVEMENT_ACTIVE.POSITION += 1
                this._input.MOVEMENT_ACTIVE.ROLL_RIGHT = false
            }
        }

        if (this._input.MOVEMENT_ACTIVE.POSITION === -1 && controlObject.position.x > -15) {
            controlObject.position.x -= this.rollSpeed/10;
        } else if (this._input.MOVEMENT_ACTIVE.POSITION === 1 && controlObject.position.x < 15) {
            controlObject.position.x += this.rollSpeed/10;
        } else if (this._input.MOVEMENT_ACTIVE.POSITION === 0 && controlObject.position.x < 0) {
            controlObject.position.x += this.rollSpeed/10;
        } else if (this._input.MOVEMENT_ACTIVE.POSITION === 0 && controlObject.position.x > 0) {
            controlObject.position.x -= this.rollSpeed/10;
        }

        // JUMPING
        let bounce_distance = this.bounce_distance;
        let acceleration = this.acceleration;
        if(this._input.MOVEMENT_ACTIVE.ROLL_UP){
            if(this._input.MOVEMENT_ACTIVE.UP_READY){
                this.MOVEMENT_TIME.ROLL_UP_X = -1 * Math.sqrt(bounce_distance);
                this._input.MOVEMENT_ACTIVE.UP_READY = false;
                this._input.MOVEMENT_ACTIVE.DOWN_READY = false;
            } else if (!this._input.MOVEMENT_ACTIVE.ROLL_DOWN){
                controlObject.position.y = (-1 * (this.MOVEMENT_TIME.ROLL_UP_X * this.MOVEMENT_TIME.ROLL_UP_X) + bounce_distance);
                this.PLAYER_HIT_BOX.position.y = 7 + (-1 * (this.MOVEMENT_TIME.ROLL_UP_X * this.MOVEMENT_TIME.ROLL_UP_X) + bounce_distance);
                this.PLAYER_HIT_BOX.scale.y = 1 + (-1 * (this.MOVEMENT_TIME.ROLL_UP_X * this.MOVEMENT_TIME.ROLL_UP_X) + bounce_distance) / 40;
                this.MOVEMENT_TIME.ROLL_UP_X += acceleration;
                if(this.MOVEMENT_TIME.ROLL_UP_X >= Math.sqrt(bounce_distance)){
                    this.PLAYER_HIT_BOX.scale.y = 1;
                    this._input._keys.forward = false;
                    this._input.MOVEMENT_ACTIVE.ROLL_UP = false;
                    this._input.MOVEMENT_ACTIVE.UP_PRESSED = false;
                    this._input.MOVEMENT_ACTIVE.UP_READY = true;
                    this._input.MOVEMENT_ACTIVE.DOWN_READY = true;
                }
            }
        }

        /* ======== DUCKING ======== */
        if (this._input.MOVEMENT_ACTIVE.ROLL_DOWN) {
            if(this._input.MOVEMENT_ACTIVE.DOWN_READY){
                this.MOVEMENT_TIME.ROLL_DOWN_X = -1 * Math.sqrt(bounce_distance);
                this._input.MOVEMENT_ACTIVE.UP_READY = false;
                this._input.MOVEMENT_ACTIVE.DOWN_READY = false;
            } else if (!this._input.MOVEMENT_ACTIVE.ROLL_UP){
                this.PLAYER_HIT_BOX.scale.y = 1 - (-1 * (this.MOVEMENT_TIME.ROLL_DOWN_X * this.MOVEMENT_TIME.ROLL_DOWN_X) + bounce_distance) / 20;
                this.PLAYER_HIT_BOX.scale.z = 1 + (-1 * (this.MOVEMENT_TIME.ROLL_DOWN_X * this.MOVEMENT_TIME.ROLL_DOWN_X) + bounce_distance) / 20;
                this.MOVEMENT_TIME.ROLL_DOWN_X += acceleration;
                if(this.MOVEMENT_TIME.ROLL_DOWN_X >= Math.sqrt(bounce_distance)){
                    this.PLAYER_HIT_BOX.scale.y = 1;
                    this._input.MOVEMENT_ACTIVE.ROLL_DOWN = false;
                    this._input.MOVEMENT_ACTIVE.DOWN_PRESSED = false;
                    this._input.MOVEMENT_ACTIVE.DOWN_READY = true;
                    this._input.MOVEMENT_ACTIVE.UP_READY = true;
                }
            }
        }

        this.PLAYER_HIT_BOX.position.x = controlObject.position.x;
    
        controlObject.quaternion.copy(_R);
    
        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);
    
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();
    
        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(controlObject.quaternion);
        sideways.normalize();
    
        sideways.multiplyScalar(velocity.x * timeInSeconds);
        forward.multiplyScalar(velocity.z * timeInSeconds);
    
        controlObject.position.add(forward);
        controlObject.position.add(sideways);
    
        oldPosition.copy(controlObject.position);
    
        if (this._mixer) {
            this._mixer.update(timeInSeconds);
        }
    }
};

class BasicCharacterControllerInput {
    constructor() {
        this._Init();    
    }
  
    _Init() {
        this._last_pressed = 0;
        this.MOVEMENT_ACTIVE = {
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
        };
        this._keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false,
            shift: false,
        };
        this._time_pressed = {
            forward: 0,
            backward: 0,
            left: 0,
            right: 0,
            space: 0,
            shift: 0,
        };
        document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    }
  
    _onKeyDown(event) {
        switch (event.keyCode) {
            case 87: // w
                this._time_pressed.forward = Date.now();
                this._keys.forward = true;
                this.MOVEMENT_ACTIVE.ROLL_UP = true;
                break;
            case 65: // a
                this._time_pressed.left = Date.now();
                this._keys.left = true;
                this.MOVEMENT_ACTIVE.ROLL_LEFT = true;
                break;
            case 83: // s
                this._time_pressed.backward = Date.now();
                this._keys.backward = true;
                this.MOVEMENT_ACTIVE.ROLL_DOWN = true;
                break;
            case 68: // d
                this._time_pressed.right = Date.now();
                this._keys.right = true;
                this.MOVEMENT_ACTIVE.ROLL_RIGHT = true;
                break;
            case 32: // SPACE
                this._time_pressed.space = Date.now();
                this._keys.space = true;
                this.MOVEMENT_ACTIVE.ROLL_UP = true;
                break;
            case 16: // SHIFT
                this._time_pressed.shift = Date.now();
                this._keys.shift = true;
                break;
        }
    }
  
    _onKeyUp(event) {
      switch(event.keyCode) {
        case 87: // w
            // this._keys.forward = false;
            this.MOVEMENT_ACTIVE.ROLL_UP = false;
            break;
        case 65: // a
            this._keys.left = false;
            this.MOVEMENT_ACTIVE.ROLL_LEFT = false;
            break;
        case 83: // s
            this._keys.backward = false;
            this.MOVEMENT_ACTIVE.ROLL_RIGHT = false;
            break;
        case 68: // d
            this._keys.right = false;
            this.MOVEMENT_ACTIVE.ROLL_DOWN = false;
            break;
        case 32: // SPACE
            this._keys.space = false;
            this.MOVEMENT_ACTIVE.ROLL_UP = false;
            break;
        case 16: // SHIFT
            this._keys.shift = false;
            break;
      }
    }
};

class FiniteStateMachine {
    constructor() {
        this._states = {};
        this._currentState = null;
    }
  
    _AddState(name, type) {
        this._states[name] = type;
    }
  
    SetState(name) {
        const prevState = this._currentState;
        
        if (prevState) {
            if (prevState.Name == name) {
                return;
            }
            prevState.Exit();
        }
    
        const state = new this._states[name](this);
    
        this._currentState = state;
        state.Enter(prevState);
    }
  
    Update(timeElapsed, input) {
        if (this._currentState) {
            this._currentState.Update(timeElapsed, input);
        }
    }
};

class CharacterFSM extends FiniteStateMachine {
    constructor(proxy) {
        super();
        this._proxy = proxy;
        this._Init();
    }
    
    _Init() {
        this._AddState('idle', IdleState);
        this._AddState('walk', WalkState);
        this._AddState('jump', JumpState);
        this._AddState('run', RunState);
        this._AddState('slide', SlideState);
        this._AddState('dance', DanceState);
    }
};
  
  
class State {
    constructor(parent) {
        this._parent = parent;
    }

    Enter() {}
    Exit() {}
    Update() {}
};
  
  
class DanceState extends State {
    constructor(parent) {
        super(parent);

        this._FinishedCallback = () => {
        this._Finished();
        }
    }

    get Name() {
        return 'dance';
    }

    Enter(prevState) {
        const curAction = this._parent._proxy._animations['dance'].action;
        const mixer = curAction.getMixer();
        mixer.addEventListener('finished', this._FinishedCallback);

        if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;

        curAction.reset();  
        curAction.setLoop(THREE.LoopOnce, 1);
        curAction.clampWhenFinished = true;
        curAction.crossFadeFrom(prevAction, 0.2, true);
        curAction.play();
        } else {
        curAction.play();
        }
    }

    _Finished() {
        this._Cleanup();
        this._parent.SetState('idle');
    }

    _Cleanup() {
        const action = this._parent._proxy._animations['dance'].action;
        
        action.getMixer().removeEventListener('finished', this._CleanupCallback);
    }

    Exit() {
        this._Cleanup();
    }

    Update(_) {
    }
};
  
  
class WalkState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'walk';
    }

    Enter(prevState) {
        const curAction = this._parent._proxy._animations['walk'].action;
        if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;

        curAction.enabled = true;

        if (prevState.Name == 'run') {
            const ratio = curAction.getClip().duration / prevAction.getClip().duration;
            curAction.time = prevAction.time * ratio;
        } else {
            curAction.time = 0.0;
            curAction.setEffectiveTimeScale(1.0);
            curAction.setEffectiveWeight(1.0);
        }

        curAction.crossFadeFrom(prevAction, 0.5, true);
        curAction.play();
        } else {
        curAction.play();
        }
    }

    Exit() {
    }

    Update(timeElapsed, input) {
        if (input._keys.forward || input._keys.backward) {
        if (input._keys.shift) {
            this._parent.SetState('run');
        }
        return;
        }

        this._parent.SetState('idle');
    }
};

class JumpState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'jump';
    }

    Enter(prevState) {
        const curAction = this._parent._proxy._animations['jump'].action;
        if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;

        curAction.enabled = true;

        if (prevState.Name == 'run') {
            const ratio = curAction.getClip().duration / prevAction.getClip().duration;
            curAction.time = prevAction.time * ratio;
        } else {
            curAction.time = 0.0;
            curAction.setEffectiveTimeScale(1.0);
            curAction.setEffectiveWeight(1.0);
        }

        curAction.crossFadeFrom(prevAction, 0.5, true);
        curAction.play();
        } else {
        curAction.play();
        }
    }

    Exit() {
    }

    Update(timeElapsed, input) {
        if (input._keys.forward || input._keys.backward) {
        if (input._keys.shift) {
            this._parent.SetState('run');
        }
        return;
        }

        this._parent.SetState('idle');
    }
};


class SlideState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'slide';
    }

    Enter(prevState) {
        const curAction = this._parent._proxy._animations['slide'].action;
        if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;

        curAction.enabled = true;

        if (prevState.Name == 'run') {
            const ratio = curAction.getClip().duration / prevAction.getClip().duration;
            curAction.time = prevAction.time * ratio;
        } else {
            curAction.time = 0.0;
            curAction.setEffectiveTimeScale(1.0);
            curAction.setEffectiveWeight(1.0);
        }

        curAction.crossFadeFrom(prevAction, 0.5, true);
        curAction.play();
        } else {
        curAction.play();
        }
    }

    Exit() {
    }

    Update(timeElapsed, input) {
        if (input._keys.forward || input._keys.backward) {
        if (input._keys.shift) {
            this._parent.SetState('run');
        }
        return;
        }

        this._parent.SetState('idle');
    }
};

class RunState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'run';
    }

    Enter(prevState) {
        const curAction = this._parent._proxy._animations['run'].action;
        if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;

        curAction.enabled = true;

        if (prevState.Name == 'walk') {
            const ratio = curAction.getClip().duration / prevAction.getClip().duration;
            curAction.time = prevAction.time * ratio;
        } else {
            curAction.time = 0.0;
            curAction.setEffectiveTimeScale(1.0);
            curAction.setEffectiveWeight(1.0);
        }

        curAction.crossFadeFrom(prevAction, 0.5, true);
        curAction.play();
        } else {
        curAction.play();
        }
    }

    Exit() {
    }

    Update(timeElapsed, input) {
        if (input._keys.forward || input._keys.backward) {
        if (!input._keys.shift) {
            this._parent.SetState('walk');
        }
        return;
        }

        this._parent.SetState('idle');
    }
};
  
  
class IdleState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'idle';
    }

    Enter(prevState) {
        const idleAction = this._parent._proxy._animations['idle'].action;
        if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        idleAction.time = 0.0;
        idleAction.enabled = true;
        idleAction.setEffectiveTimeScale(1.0);
        idleAction.setEffectiveWeight(1.0);
        idleAction.crossFadeFrom(prevAction, 0.5, true);
        idleAction.play();
        } else {
        idleAction.play();
        }
    }

    Exit() {
    }

    Update(_, input) {
        if (input._keys.forward) {
            this._parent.SetState('jump');
        } else if(input._keys.backward){
            this._parent.SetState('slide');
        }else if (input._keys.space) {
        this._parent.SetState('dance');
        }
    }
};

class CharacterControllerDemo {
    constructor(renderer, scene, camera) {
        this._threejs = renderer;
        this._scene = scene;
        this._camera = camera;
        this.rollSpeed = 30;
        this._Initialize();
    }

    setRollSpeed(val){
        this.rollSpeed = val;
        this._controls.setRollSpeed(val);
    }

    startGame() {
        GLOBAL_STATE = "PLAYING";
        this.TIME_START = Date.now();
        console.log("NOW PLAYING");
    }
  
    _Initialize() {
        this.TIME_START = Date.now();
        if(localStorage.getItem("player_name")) {
            this.PLAYER_NAME = localStorage.getItem("player_name");
        } else {
            this.PLAYER_NAME = prompt("Please enter your name", "Ariesta ❤️");
            localStorage.setItem("player_name", this.PLAYER_NAME);
        }

        this._mixers = [];
        this._previousRAF = null;
        this.MOVING_OBJECT = [];
        this.TEMP_COIN = this.coinFactory(new THREE.Vector3(0,7,0));
        this.PLAYER_HIT_BOX = this.createPlayerHitBox();
        // this._scene.add(this.PLAYER_HIT_BOX);

        for(let i=0; i<10; i++){
            this.MOVING_OBJECT.push( this.generateChunk(new THREE.Vector3(0,0, i*50)) );
        }
    
        this._LoadAnimatedModel();
        this._RAF();
    }

    randomBetween(min,max){
        let random = (Math.random()*(max-min+1)+min);
        if (random > max){ return max-1}
        else { return random}
    }
  
    makeGate(adjustment){
        // Setara level strukturnya dengan MINI_TILES
        let this_obj = [];
        {
            let pillarPos = [];
            if(adjustment.x === -1) {
                pillarPos = [0, 1]
            }
            else if(adjustment.x === 0){
                pillarPos = [-1, 1]
            }
            else {
                pillarPos = [-1, 0]
            }

            const geometry = new THREE.BoxGeometry(15, 50, 40);
            const material = new THREE.MeshPhongMaterial({color: 0x444444});
            
            // PILLAR KIRI
            const obj = new THREE.Mesh(geometry, material);
            obj.position.set(pillarPos[0] * 15 ,20 + adjustment.y, 0 + adjustment.z);
            obj.name = "PILLAR_KIRI";
            
            // PILLAR KANAN
            const obj2 = new THREE.Mesh(geometry, material);
            obj2.position.set(pillarPos[1] * 15 ,20 + adjustment.y, 0 + adjustment.z);
            obj2.name = "PILLAR_KANAN";
            
            this._scene.add(obj, obj2);
            this_obj.push(obj, obj2);
        }

        {
            const geometry = new THREE.BoxGeometry(15, 10, 40);
            const material = new THREE.MeshPhongMaterial({color: 0x444444});
            const obj = new THREE.Mesh(geometry, material);
    
            obj.position.set(adjustment.x * 15, 40, 0 + adjustment.z);
            obj.name = "PILLAR_ATAS";
            this._scene.add(obj);
            this_obj.push(obj);
        }
        return this_obj;
    };

    last(obj, pos=-1){
        return obj[obj.length + pos];
    }

    makePalangRendah(adjustment){
        // Setara level strukturnya dengan MINI_TILES
        let this_obj = [];
        {
            const geometry = new THREE.BoxGeometry(1.5, 8, 1);
            const material = new THREE.MeshPhongMaterial({color: 0xC6B9AE});
            
            // TIANG KIRI
            const obj = new THREE.Mesh(geometry, material);
            obj.position.set(-7.5 + 2 + adjustment.x ,8/2+ 1 + adjustment.y, 0 + adjustment.z);
            obj.name = "TIANG_KIRI";
            
            // TIANG KANAN
            const obj2 = new THREE.Mesh(geometry, material);
            obj2.position.set(-1*(-7.5 + 2) + adjustment.x ,8/2+1 + adjustment.y, 0 + adjustment.z);
            obj2.name = "TIANG_KANAN";

            this._scene.add(obj, obj2);
            this_obj.push(obj, obj2);
        }

        // PALANG
        {
            const geometry = new THREE.BoxGeometry(15, 3, 1);
            const material = new THREE.MeshPhongMaterial({color: 0xBC5043});
            const obj = new THREE.Mesh(geometry, material);
    
            obj.position.set(0 + adjustment.x ,3/2+8 + 1 + adjustment.y, 0 + adjustment.z);
            obj.name = "PALANG";
            this._scene.add(obj);
            this_obj.push(obj);
        }
        return this_obj;
    };

    generateObstacle(adjustment){
        // Random thing to determine will the palang created? wkwwk
        if(this.MOVING_OBJECT.length >= 8){
            let roullete = parseInt(this.randomBetween(0, 20));
            let mid_left_right = parseInt(this.randomBetween(0,3));

            if(this.last(this.MOVING_OBJECT).obstacle.length > 0){
                if(!(roullete % 5) && this.last(this.MOVING_OBJECT).obstacle[0].name !== "GATE" && this.last(this.MOVING_OBJECT, -2).obstacle[0].name !== "GATE"){
                    return {
                        name: "GATE",
                        obj: this.makeGate(new THREE.Vector3((mid_left_right-1) ,0, 0 + adjustment.z))
                    }
                }else if(!(roullete % 2) && this.last(this.MOVING_OBJECT).obstacle.name !== "PALANG"){
                    return {
                        name: "PALANG",
                        obj: this.makePalangRendah(new THREE.Vector3((mid_left_right-1) * 15 ,0, adjustment.z))
                    }
                }
            }
        }
        return {
            name: "EMPTY",
            obj: null
        }
    }

    makeTiles(x_adjustment, y_adjustment, z_adjustment){
        let this_obj = [];
        // Tiles Factory
        {
            const geometry = new THREE.BoxGeometry(15, 1, 50);
            const material = new THREE.MeshPhongMaterial({color: 0x313A42 });
            const obj = new THREE.Mesh(geometry, material);
                    
            obj.position.set(0 + x_adjustment,0 + y_adjustment,0 + z_adjustment);
            obj.name = "KOTAK";
            
            this_obj.push(obj);
            this._scene.add(obj);
            // Buat stik di kanan
            {
                const geometry = new THREE.BoxGeometry(1, 0.5, 50);
                const material = new THREE.MeshPhongMaterial({color: 0xC6B9AE});
                const obj = new THREE.Mesh(geometry, material);
                        
                obj.position.set(0+7.5/2 + x_adjustment,1+0.5 + y_adjustment,0 + z_adjustment);
                obj.name = "STIK_KANAN";
                this_obj.push(obj);
                this._scene.add(obj);
            }
            // Buat stik di kiri
            {
                const geometry = new THREE.BoxGeometry(1, 0.5, 50);
                const material = new THREE.MeshPhongMaterial({color: 0xC6B9AE});
                const obj = new THREE.Mesh(geometry, material);
                        
                obj.position.set(0 - 7.5/2 + x_adjustment,1+0.5+ y_adjustment,0+ z_adjustment);
                obj.name = "STIK_KIRI";
                this_obj.push(obj);
                this._scene.add(obj);
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
                    this._scene.add(obj);
                }
            }
        }
        return this_obj;
    }

    makeHouse(adjustment){
        let height = this.randomBetween(30, 70);
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
        const material = new THREE.MeshPhongMaterial({color: randColor()});
        const obj = new THREE.Mesh(geometry, material);
                
        obj.position.set(0 + adjustment.x ,height/2 + adjustment.y, 0 + adjustment.z);
        obj.name = "HOUSE";
        this._scene.add(obj);
        return obj;
    };

    // COIN Factory
    coinFactory(adjustment){
        {
            var loader = new THREE.TextureLoader();
            loader.setCrossOrigin("");
            var texture1 = loader.load("./gold.jpg");
            texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
            texture1.repeat.set(0.05, 0.05);
            var texture2 = loader.load("https://threejs.org/examples/textures/hardwood2_diffuse.jpg");
            texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
            texture2.repeat.set(0.1, 0.1);
            
            var outerRadius = 2;
            var innerRadius = 0;
            var height = 0.75;
            
            var arcShape = new THREE.Shape();
            arcShape.moveTo(outerRadius * 2, outerRadius);
            arcShape.absarc(outerRadius, outerRadius, outerRadius, 0, Math.PI * 2, false);
            var holePath = new THREE.Path();
            holePath.moveTo(outerRadius + innerRadius, outerRadius);
            holePath.absarc(outerRadius, outerRadius, innerRadius, 0, Math.PI * 2, true);
            arcShape.holes.push(holePath);
            
            var geometry = new THREE.ExtrudeGeometry(arcShape, {
                amount: height,
                bevelEnabled: false,
                steps: 1,
                curveSegments: 60
            });
            geometry.center();
            geometry.rotateX(Math.PI * -.5);
            var mesh = new THREE.Mesh(geometry, [
                new THREE.MeshBasicMaterial({map: texture1}),
                new THREE.MeshBasicMaterial({map: texture2})
            ]);
            
            mesh.position.set(adjustment.x, adjustment.y, adjustment.z);
            mesh.name = "KOIN";
            mesh.rotation.x += Math.PI * 0.5;
            // scene.add(mesh);
            return mesh;
        }
    }

    generateCoinChunk(current_obstacle, adjustment){
        let this_obj = [];
        if(current_obstacle.name === "EMPTY"){
            let mid_left_right = parseInt(this.randomBetween(0,3));
            for(let i=-2; i<3; i++){
                {
                    let COIN = this.TEMP_COIN.clone();                            
                    COIN.position.set((mid_left_right-1)*15 + adjustment.x,7 + adjustment.y, i*10 + adjustment.z);
                    this._scene.add(COIN);
                    this_obj.push(COIN);
                }
            }
        }
        return this_obj;
    }

    generateChunk(adjustment){
        let temp_obstacle = GLOBAL_STATE === "PLAYING" ? this.generateObstacle(new THREE.Vector3(0, 0, -1*adjustment.z)) : {name: "EMPTY", obj: null};
        return {
            map: {
                tiles: [
                    this.makeTiles(-1*15,0,-1*adjustment.z),
                    this.makeTiles(0*15,0,-1*adjustment.z),
                    this.makeTiles(1*15,0,-1*adjustment.z),
                ],
                house: [
                    this.makeHouse(new THREE.Vector3( 45,0,-1*adjustment.z)),
                    this.makeHouse(new THREE.Vector3(-45,0,-1*adjustment.z)),
                ],
                rails: [],
            },
            obstacle: [
                temp_obstacle
            ],
            power_up: [
                this.generateCoinChunk(temp_obstacle, new THREE.Vector3(0,0,-1*adjustment.z))
            ]
        }
    }
    
    generateRandomColor(){
        var letters = '0123456789ABCDEF';
        var color = '0x';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return parseInt(color, 16);
    }

    createPlayerHitBox(){
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const color = this.generateRandomColor();
        const material = new THREE.MeshPhongMaterial({color});
        const obj = new THREE.Mesh(geometry, material);
                
        obj.position.set(0,7,0);
        obj.name = "PLAYER";
        // scene.add(obj);
        return obj;
    }

    moveCamera(obj) {
        this._camera.position.x = obj.position.x;
        this._camera.position.y = obj.position.y + 15;
        this._camera.lookAt(obj.position);
    }

    _LoadAnimatedModel() {
      const params = {
        camera: this._camera,
        scene: this._scene,
      }
      this._controls = new BasicCharacterController(params, this.PLAYER_HIT_BOX, this.rollSpeed);
    }
  
    _LoadAnimatedModelAndPlay(path, modelFile, animFile, offset) {
        const loader = new FBXLoader();
        loader.setPath(path);
        loader.load(modelFile, (fbx) => {
            fbx.scale.setScalar(0.1);
            fbx.traverse(c => {
            c.castShadow = true;
            });
            fbx.position.copy(offset);
    
            const anim = new FBXLoader();
            anim.setPath(path);
            anim.load(animFile, (anim) => {
            const m = new THREE.AnimationMixer(fbx);
            this._mixers.push(m);
            const idle = m.clipAction(anim.animations[0]);
            idle.play();
            });
            this._scene.add(fbx);
        });
    }
  
    _LoadModel() {
      const loader = new GLTFLoader();
      loader.load('./resources/thing.glb', (gltf) => {
        gltf.scene.traverse(c => {
          c.castShadow = true;
        });
        this._scene.add(gltf.scene);
      });
    }
  
    _OnWindowResize() {
      this._camera.aspect = window.innerWidth / window.innerHeight;
      this._camera.updateProjectionMatrix();
      this._threejs.setSize(window.innerWidth, window.innerHeight);
    }
  
    resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    detectCollisionCubes(object1, object2){
        object1.geometry.computeBoundingBox(); //not needed if its already calculated
        object2.geometry.computeBoundingBox();
        object1.updateMatrixWorld();
        object2.updateMatrixWorld();
        
        var box1 = object1.geometry.boundingBox.clone();
        box1.applyMatrix4(object1.matrixWorld);
      
        var box2 = object2.geometry.boundingBox.clone();
        box2.applyMatrix4(object2.matrixWorld);
      
        return box1.intersectsBox(box2);
    }

    _RAF() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }

            console.log("GLOBAL_STATE", GLOBAL_STATE);
            this.PLAYER_HIT_BOX.position.y = this.PLAYER_HIT_BOX.position.y + (Math.sin(t/100)/15);
            // this._scene.add(this.PLAYER_HIT_BOX);

            if (this.resizeRendererToDisplaySize(this._threejs)) {
                // console.log("RESIZED")
                const canvas = this._threejs.domElement;
                this._camera.aspect = canvas.clientWidth / canvas.clientHeight;
                this._camera.updateProjectionMatrix();
            }


            this.MOVING_OBJECT.forEach((CHUNK) => {
                // return;
                let removeornot = false;
                // MOVE ALL OBJECT
                CHUNK.map.tiles.forEach((tile) => {
                    tile.forEach((obj) => {
                        obj.position.z += this.rollSpeed/10;
                        if(obj.position.z >= 50){
                            if(obj.name === "KOTAK"){ removeornot = true }
                        }    
                    })
                })
    
                CHUNK.map.house.forEach((house) => {
                    house.position.z += this.rollSpeed/10;
                })
    
                CHUNK.map.rails.forEach((rail) => {
                    rail.position.z += this.rollSpeed/10;
                })
    
                // Also check collision
                CHUNK.obstacle.forEach((obs) => {
                    if(obs.obj != null){
                        obs.obj.forEach((obj) => {
                            obj.position.z += this.rollSpeed/10;
                            
                            if(GLOBAL_STATE == "PLAYING"){
                                let curScore = Math.floor((Date.now() - this.TIME_START)/ 10)
                                $("#alive_score").html(curScore);
                                $("#coin_score").html(GLOBAL_COIN);
                                if(curScore > Number($("#alive_highscore").html())) {
                                    $("#alive_highscore").html(curScore);
                                };
                                if(GLOBAL_COIN > Number($("#coin_highscore").html())) {
                                    $("#coin_highscore").html(GLOBAL_COIN)
                                }

                            }
                            if(this.detectCollisionCubes(obj, this.PLAYER_HIT_BOX)){
                                $("#mainmenu_container").show()
                                $("#score_container").hide()
                                let curScore = Math.floor((Date.now() - this.TIME_START)/ 10)
                                
                                if(GLOBAL_STATE == "PLAYING"){
                                    if(curScore >= Number($("#alive_highscore").html())) {
                                        localStorage.setItem("alive_highscore", curScore);
                                    };
                                    if(GLOBAL_COIN >= Number($("#coin_highscore").html())) {
                                        localStorage.setItem("coin_highscore", GLOBAL_COIN);
                                    }
                                    console.log("🚀 ~ file: player.js ~ line 1169 ~ CharacterControllerDemo ~ obs.obj.forEach ~", Number($("#coin_highscore").html()))
                                    
                                    $.ajax({
                                        type: 'POST',
                                        url: "http://grafkom.nyakit.in/save.php",
                                        data: {
                                            player_name: this.PLAYER_NAME,
                                            coin_earned: GLOBAL_COIN,
                                            time_alive: curScore
                                        },
                                        success: function(resultData) {
                                            console.log(resultData);
                                        }
                                    });
                                }
                                GLOBAL_STATE = "GAME OVER";
                                GLOBAL_COIN = 0;
                                // alert("GAME OVER!, YOUR COIN :: "+GLOBAL_COIN)
                            }  
                        })    
                    }
                })
    
                // Also check collision
                CHUNK.power_up.forEach((obs) => {
                    obs.forEach((obj) => {
                        obj.rotation.z += 0.02;
                        obj.position.z += this.rollSpeed/10;
                        if(this.detectCollisionCubes(obj, this.PLAYER_HIT_BOX) && GLOBAL_STATE === "PLAYING"){
                            GLOBAL_COIN += 1;
                            console.log("KOIN", GLOBAL_COIN);
                            const audio_coin = new Audio('resources/audio/coin.mp3');
                            audio_coin.play();
                            let index = obs.findIndex( mesh => mesh.uuid === obj.uuid);
                            this._scene.remove(obj);
                            obs.splice(index, 1);
                        }
                    })    
                })
    
    
                // THEN CHECK IF THE OBJECT HAS 50 BEHIND
                if(removeornot){
                    // Remove all object
                    CHUNK.map.tiles.forEach((tile) => {
                        tile.forEach((obj) => {
                            this._scene.remove(obj);
                        })
                    })
        
                    CHUNK.map.house.forEach((house) => {
                        this._scene.remove(house);
                    })
        
                    CHUNK.map.rails.forEach((rail) => {
                        rail.position.z += this.rollSpeed/10;
                        this._scene.remove(rail);
                    })
        
                    // Also check collision
                    CHUNK.obstacle.forEach((obs) => {
                        if(obs.obj != null){
                            obs.obj.forEach((obj) => {
                                this._scene.remove(obj);
                            })    
                        }
                    })
    
                    CHUNK.power_up.forEach((obs) => {
                        obs.forEach((obj) => {
                            this._scene.remove(obj);
                        })    
                    })
                    this.MOVING_OBJECT.shift();
                    this.MOVING_OBJECT.push( this.generateChunk(new THREE.Vector3(0,0, (10-1)*50)) );
                }
            });

            this.moveCamera(this.PLAYER_HIT_BOX);
    
            this._RAF();
    
            this._threejs.render(this._scene, this._camera);
            this._Step(t - this._previousRAF);
            this._previousRAF = t;
        });
    }
  
    _Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        if (this._mixers) {
            this._mixers.map(m => m.update(timeElapsedS));
        }
    
        if (this._controls) {
            this._controls.Update(timeElapsedS);
        }
    }
}
  

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

let _APP = null;
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
    const aspect = window.innerWidth / window.innerHeight;
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

    // const minMaxGUIHelper2 = new MinMaxGUIHelper(GLOBAL_RAF, 'near', 'far', 0.1);
    // gui.add(minMaxGUIHelper2, 'min', 0.1, 1000, 0.1).name('far').onChange(() => {});
    // let RAF_INPUT = gui.add(GLOBAL_RAF, 'speed').name('RAF').listen();
    gui.add(GLOBAL_RAF, 'speed').name("RAF speed").min(1).max(100).step(0.25).onChange(() => {
        _APP.setRollSpeed(GLOBAL_RAF.speed);
        console.log(GLOBAL_RAF);
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

    {
        scene.fog = new THREE.Fog( 0x111122, 0, 400 )

        const material = new THREE.MeshPhongMaterial({color:0x111111});
        const far_wall = new THREE.Mesh(new THREE.BoxGeometry(200, 400, 0.5), material);
        const left_wall = new THREE.Mesh(new THREE.BoxGeometry(500, 250, 0.5), material);
        const right_wall = new THREE.Mesh(new THREE.BoxGeometry(500, 250, 0.5), material);
        
        far_wall.position.set(0, 125,-45*10);
        left_wall.position.set(90, 125, -200);
        left_wall.rotation.y = Math.PI * -.5;
        right_wall.position.set(-90, 125, -200);
        right_wall.rotation.y = Math.PI * -.5;
        scene.add(far_wall);
        scene.add(left_wall);
        scene.add(right_wall);
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

    window.addEventListener('DOMContentLoaded', () => {
        _APP = new CharacterControllerDemo(renderer, scene, camera);
        _APP.setRollSpeed(GLOBAL_RAF.speed);
    });


};

animate();

$(document).ready(() => {
    $('#btn-start').on('click', () => {
        // audio_soundtrack.stop();
        audio_soundtrack.play();

        if(localStorage.getItem("coin_highscore")) {
            $("#coin_highscore").html(localStorage.getItem("coin_highscore"))
        } else {
            $("#coin_highscore").html("0");
        }
        if(localStorage.getItem("alive_highscore")) {
            $("#alive_highscore").html(localStorage.getItem("alive_highscore"))
        } else {
            $("#alive_highscore").html("0");
        }
        startGame();
        $('#mainmenu_container').hide();
        $('#score_container').show();
    })
})

function startGame() {
    _APP.startGame();
}