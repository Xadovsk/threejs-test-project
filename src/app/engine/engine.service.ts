import * as THREE from 'three';
import {ElementRef, Injectable, NgZone, OnDestroy} from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { Raycaster, Vector2, Vector3 } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

@Injectable({providedIn: 'root'})
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;
  private fog: THREE.Fog;

  private cube: THREE.Mesh;
  private cube2: THREE.Mesh;
  private cube3: THREE.Mesh;

  // Teleport Meshes
  private teleport1: THREE.Mesh;
  private teleport2: THREE.Mesh;
  private teleport3: THREE.Mesh;
  private teleport4: THREE.Mesh;

  //Room Meshes
  private room: THREE.Mesh;
  private room2: THREE.Mesh;
  private room3: THREE.Mesh;
  private room4: THREE.Mesh;

  private travelPlayer: boolean;
  private travelTarget: THREE.Vector3;

  private clock = new THREE.Clock();

  private raycaster = new THREE.Raycaster();
  public mouse = new THREE.Vector2();
  private mouse3d = new THREE.Vector3();

  public mouseCoord;

  private frameId: number = null;

  private controls: FirstPersonControls;

  private nfts: Map<string, string>;

  private cloudParticles = [];

  private vertexShader = `varying vec2 vUv; 
  void main()
  {
      vUv = uv;
  
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
      gl_Position = projectionMatrix * mvPosition;
  }`;

  private fragmentShader= `
  #include <common>

  uniform vec3 iResolution;
  uniform float iTime;

  const float cloudscale = 1.1;
const float speed = 0.03;
const float clouddark = 0.5;
const float cloudlight = 0.3;
const float cloudcover = 0.2;
const float cloudalpha = 8.0;
const float skytint = 0.5;
const vec3 skycolour1 = vec3(0.2, 0.4, 0.6);
const vec3 skycolour2 = vec3(0.4, 0.7, 1.0);

const mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );

vec2 hash( vec2 p ) {
	p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec2 p ) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;
	vec2 i = floor(p + (p.x+p.y)*K1);	
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); //vec2 of = 0.5 + 0.5*vec2(sign(a.x-a.y), sign(a.y-a.x));
    vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;
    vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return dot(n, vec3(70.0));	
}

float fbm(vec2 n) {
	float total = 0.0, amplitude = 0.1;
	for (int i = 0; i < 7; i++) {
		total += noise(n) * amplitude;
		n = m * n;
		amplitude *= 0.4;
	}
	return total;
}

// -----------------------------------------------

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 p = fragCoord.xy / iResolution.xy;
	vec2 uv = p*vec2(iResolution.x/iResolution.y,1.0);    
    float time = iTime * speed;
    float q = fbm(uv * cloudscale * 0.5);
    
    //ridged noise shape
	float r = 0.0;
	uv *= cloudscale;
    uv -= q - time;
    float weight = 0.8;
    for (int i=0; i<8; i++){
		r += abs(weight*noise( uv ));
        uv = m*uv + time;
		weight *= 0.7;
    }
    
    //noise shape
	float f = 0.0;
    uv = p*vec2(iResolution.x/iResolution.y,1.0);
	uv *= cloudscale;
    uv -= q - time;
    weight = 0.7;
    for (int i=0; i<8; i++){
		f += weight*noise( uv );
        uv = m*uv + time;
		weight *= 0.6;
    }
    
    f *= r + f;
    
    //noise colour
    float c = 0.0;
    time = iTime * speed * 2.0;
    uv = p*vec2(iResolution.x/iResolution.y,1.0);
	uv *= cloudscale*2.0;
    uv -= q - time;
    weight = 0.4;
    for (int i=0; i<7; i++){
		c += weight*noise( uv );
        uv = m*uv + time;
		weight *= 0.6;
    }
    
    //noise ridge colour
    float c1 = 0.0;
    time = iTime * speed * 3.0;
    uv = p*vec2(iResolution.x/iResolution.y,1.0);
	uv *= cloudscale*3.0;
    uv -= q - time;
    weight = 0.4;
    for (int i=0; i<7; i++){
		c1 += abs(weight*noise( uv ));
        uv = m*uv + time;
		weight *= 0.6;
    }
	
    c += c1;
    
    vec3 skycolour = mix(skycolour2, skycolour1, p.y);
    vec3 cloudcolour = vec3(1.1, 1.1, 0.9) * clamp((clouddark + cloudlight*c), 0.0, 1.0);
   
    f = cloudcover + cloudalpha*f*r;
    
    vec3 result = mix(skycolour, clamp(skytint * skycolour + cloudcolour, 0.0, 1.0), clamp(f + c, 0.0, 1.0));
    
	fragColor = vec4( result, 1.0 );
}

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
  `;

private uniforms = {
  iTime: { value: 0 },
  iResolution:  { value: new THREE.Vector3() },
};

  public constructor(private ngZone: NgZone) {
  }

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public onMouseMove( event ) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    //console.log(( event.clientX / window.innerWidth ) * 2 - 1);
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    this.mouse3d = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
    //this.controls.lookAt(this.mouse3d.x, this.mouse3d.y, this.mouse3d.z);
  }

  

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;
    this.nfts = new Map;
    this.uniforms.iResolution.value.set(canvas.nativeElement.width, canvas.nativeElement.height, 1);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new THREE.Scene();
    this.fog = new THREE.Fog('white');

    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 1, 10000
    );
    //this.camera.position.z = 5;
    this.camera.position.z = 5;
    this.scene.add(this.camera);

    const loader = new FBXLoader();

loader.load( 'assets/models/rooms-and-gate.fbx',(fbx) => {
  fbx.position.set(0, 0, 0);
  fbx.scale.set(.001,.001,.001)

	this.scene.add( fbx );

}, undefined, function ( error ) {

	console.error( error );

} );

    // soft white light
    this.light = new THREE.AmbientLight(0x404040);
    this.light.position.z = 10;
    this.scene.add(this.light);

    let directionalLight = new THREE.DirectionalLight(0xff8c19);
    directionalLight.position.set(0,0,1);
    this.scene.add(directionalLight);
    /* let orangeLight = new THREE.PointLight(0xcc6600,50,450,1.7);
    orangeLight.position.set(200,300,100);
    this.scene.add(orangeLight);
    let redLight = new THREE.PointLight(0xd8547e,50,450,1.7);
    redLight.position.set(100,300,100);
    this.scene.add(redLight);
    let blueLight = new THREE.PointLight(0x3677ac,50,450,1.7);
    blueLight.position.set(300,300,200);
    this.scene.add(blueLight); */

    const texture2 = new THREE.TextureLoader().load( "assets/images/smoke-1.png" );
    const texture = new THREE.TextureLoader().load( "https://1.bp.blogspot.com/-Amtf96EIKqE/YNIfb-CgJkI/AAAAAAAATlo/X0nbEOwOQLMhaR-Ea9nOUXrGso47Q0OigCLcBGAsYHQ/s776/absol.png" );
    //const texture2 = new THREE.TextureLoader().load( 'https://lh3.googleusercontent.com/TZ6FUtCv6aCmDNyW52ln30Wttsd4skeXKw252Jb0xZVaewjlFwXGFD8Hcj9_vjCT7VN6KZFXHcTQoefkZOcLZM7simvRHAA60l4q=s0' );
    //const texture3 = new THREE.TextureLoader().load( "https://img.elo7.com.br/product/zoom/14828CC/mega-charizard-x-garra-do-dragao-geek.jpg" );

    const cloudGeo = new THREE.BoxGeometry(5000,5000);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map:texture2,
      transparent: true
    });

    /* for(let p=0; p<50; p++) {
      let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
      cloud.position.set(
        Math.random()*800 -400,
        0,
        Math.random()*-500-100
      );
      cloud.rotation.x = 0;
      cloud.rotation.y = 0;
      cloud.rotation.z = 0;
      cloud.material.side = THREE.DoubleSide;
      cloud.material.opacity = 0.55;
      this.cloudParticles.push(cloud);
      this.scene.add(cloud);
    } */

    //Skybox Texture
    let materialArray = [];
    let texture_ft = new THREE.TextureLoader().load( 'assets/images/DaylightBox_Back.bmp');
    let texture_bk = new THREE.TextureLoader().load( 'assets/images/DaylightBox_Front.bmp');
    let texture_up = new THREE.TextureLoader().load( 'assets/images/DaylightBox_Top.bmp');
    let texture_dn = new THREE.TextureLoader().load( 'assets/images/DaylightBox_Bottom.bmp');
    let texture_rt = new THREE.TextureLoader().load( 'assets/images/DaylightBox_Right.bmp');
    let texture_lf = new THREE.TextureLoader().load( 'assets/images/DaylightBox_Left.bmp');
  
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));
    for (let i = 0; i < 6; i++) {
      materialArray[i].side = THREE.BackSide;
      materialArray[i].fog = false;
    }

    let skyboxGeo = new THREE.BoxGeometry( 10000, 10000, 10000);
    let skybox = new THREE.Mesh( skyboxGeo, materialArray );
    const materialFloor = new THREE.MeshBasicMaterial( {map: texture2} );
    materialFloor.side = THREE.DoubleSide;
    materialFloor.fog = false;
    let floorGeo = new THREE.BoxGeometry( 10000, 1, 10000 );
    let floor = new THREE.Mesh( floorGeo, materialFloor )
    floor.position.set( 0, -2, 0)
    this.scene.add( skybox );
    this.scene.add(floor)

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const roomGeometry = new THREE.BoxGeometry(10, 10, 10);
    const frameGeometry = new THREE.BoxGeometry(3, 5, 0.1);
    const geometry3 = new THREE.BoxGeometry(1, 0.5, 1);
    const simpleMaterial = new THREE.MeshBasicMaterial({ wireframe: true })
    const colorMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color('black'), wireframe: true })
    const material = new THREE.MeshBasicMaterial( {map: texture} );
    material.side = THREE.DoubleSide;
    const material2 = new THREE.MeshBasicMaterial( {map: texture} );
    const material3 = new THREE.MeshBasicMaterial( {map: texture} );

    //NFT gallery
    this.cube = new THREE.Mesh(frameGeometry, material);
    this.cube.name = '15856337856917357433264578137314620566549072045013887703133171381486512766977';
    this.cube.position.set(10, -10, 5);
    this.cube2 = new THREE.Mesh(frameGeometry, material2);
    this.cube2.name = '15856337856917357433264578137314620566549072045013887703133171384785047650305';
    this.cube2.position.set(-10, -10, 5);
    this.cube3 = new THREE.Mesh(frameGeometry, material3);
    this.cube3.name = '15856337856917357433264578137314620566549072045013887703133171388083582533633';
    this.cube3.position.set(-10, -10, -15);

    //Teleport creation
    colorMaterial.side = THREE.DoubleSide;
    this.teleport1 = new THREE.Mesh(geometry, simpleMaterial);
    this.teleport1.name = 'teleport';
    this.teleport1.position.set(10, 0, 10)
    this.teleport2 = new THREE.Mesh(geometry, simpleMaterial);
    this.teleport2.name = 'teleport';
    this.teleport2.position.set(-10, 0, 10)
    this.teleport3 = new THREE.Mesh(geometry, simpleMaterial);
    this.teleport3.name = 'teleport';
    this.teleport3.position.set(-10, 0, -10)
    this.teleport4 = new THREE.Mesh(geometry, simpleMaterial);
    this.teleport4.name = 'teleport';
    this.teleport4.position.set(10, 0, -10)

    //Room creation
    this.room = new THREE.Mesh(roomGeometry, colorMaterial);
    this.room.position.set(10, -10, 10)
    this.room2 = new THREE.Mesh(roomGeometry, colorMaterial);
    this.room2.position.set(-10, -10, 10)
    this.room3 = new THREE.Mesh(roomGeometry, colorMaterial);
    this.room3.position.set(10, -10, -10)
    this.room4 = new THREE.Mesh(roomGeometry, colorMaterial);
    this.room4.position.set(-10, -10, -10)
    //const group = new THREE.Group()
    //group.add(this.cube2);
    //group.add(this.cube3);
   // this.scene.add(group);
    //this.scene.fog = new THREE.Fog('white', 1,10);
    //this.renderer.setClearColor(this.scene.fog.color);
    this.scene.add(this.cube);
    this.scene.add(this.cube2);
    this.scene.add(this.cube3);
    this.scene.add(this.teleport1);
    this.scene.add(this.teleport2);
    this.scene.add(this.teleport3);
    this.scene.add(this.teleport4);
    this.scene.add(this.room);
    this.scene.add(this.room2);
    this.scene.add(this.room3);
    this.scene.add(this.room4);
    this.nfts.set(this.cube.name, '15856337856917357433264578137314620566549072045013887703133171381486512766977');
    this.nfts.set(this.cube2.name, '15856337856917357433264578137314620566549072045013887703133171384785047650305');
    this.nfts.set(this.cube3.name, '15856337856917357433264578137314620566549072045013887703133171388083582533633');

    // this.controls = new FirstPersonControls(this.camera, document.getElementById('FPS'));
    this.camera.lookAt(this.mouse3d.x, this.mouse3d.y, this.mouse3d.z);
    this.controls = new FirstPersonControls(this.camera, this.renderer.domElement);
    this.controls.activeLook = true;
    this.controls.mouseDragOn = true;
    this.controls.movementSpeed = 10;
		this.controls.lookSpeed = 0.2;
    this.controls.heightCoef = 0;
    //this.controls.domElement.addEventListener( 'click', this.onMouseDown);
    //this.controls.lookAt()
    //controls.target.set( 0, 0.5, 0 );
	//	controls.update();
	//	controls.enablePan = false;
  	//controls.enableDamping = true;

  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }

      //window.addEventListener( 'click', this.onMouseDown);

      window.addEventListener('click', () => {
        this.onMouseDown(event);
      });

      window.addEventListener('mousemove', () => {
        this.onMouseMove(event);
      });

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    /* this.cloudParticles.forEach(p => {
      p.rotation.z -=0.001;
    }); */
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects( this.scene.children );

    if(intersects.length > 0){
      //console.log(intersects[0].object.name)
      console.log(this.controls.object.position.distanceTo(intersects[0].object.position))
      if(intersects[0].object.name === 'teleport')
      if( this.controls.object.position.distanceTo(intersects[0].object.position) < 1) {
        //this.controls.object.position.copy(intersects[0].point)
        console.log(intersects[0].distance)
        this.controls.object.position.set(this.controls.object.position.x, this.controls.object.position.y - 10, this.controls.object.position.z);
      }
      //console.log( this.scene.children )
      
    }

    if (this.travelPlayer) {
      this.controls.object.position.lerp( this.travelTarget, 0.1);
      //console.log(this.controls.object.position.equals(this.travelTarget));
      //console.log(this.travelTarget);
      //this.controls.object.position === this.travelTarget ? this.travelPlayer = false : '';
    }

    this.uniforms.iTime.value += 0.1;
    this.controls.update(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    console.log(this.camera);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public onMouseDown(event): void {
    console.log('click')

    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera)
    this.raycaster.far = 5;

    const intersects = this.raycaster.intersectObjects( this.scene.children );

    if(intersects.length > 0) {
      if(intersects[0].object.name.length > 10) {
        this.controls.object.position.set(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z + 2);
        this.controls.lookAt(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z);
        this.travelTarget = new Vector3(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z + 2);
        let nftDiv = document.getElementById('nft');
        nftDiv.setAttribute('style', 'display: block;');
        if(document.getElementById('nft-card')) {
          document.getElementById('nft-card').remove();
        }
        let nftElement = document.createElement('nft-card')
        nftElement.setAttribute('tokenId', intersects[0].object.name)
        nftElement.setAttribute('contractAddress', "0x495f947276749Ce646f68AC8c248420045cb7b5e")
        nftElement.setAttribute('vertical', '')
        nftElement.setAttribute('id', 'nft-card')
        nftDiv.appendChild(nftElement);
        this.controlsActivation(false);
        console.log(intersects[0].object.name)
        //this.controls.lookAt(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z)
      }
    }
  }

  public controlsActivation(active: boolean): void {
    this.controls.activeLook = active;
    this.controls.enabled = active;
  }
}
