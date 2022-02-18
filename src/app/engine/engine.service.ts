import * as THREE from 'three';
import {ElementRef, Injectable, NgZone, OnDestroy} from '@angular/core';
import { BufferGeometryUtils, Color, FontLoader, MeshBasicMaterial, TextBufferGeometry, TextGeometry, TextureLoader, Vector3 } from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RequestService } from './requests.service';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let TWEEN = require('@tweenjs/tween.js');

@Injectable({providedIn: 'root'})
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;
  private mesh: THREE.Mesh;
  private composer: EffectComposer;
  private material: THREE.MeshLambertMaterial;
  private UnrealBloomPass: UnrealBloomPass;
  private renderScene: RenderPass;
  private copyPass: ShaderPass;
  private smokeParticles = [];
  private spheres: THREE.Mesh[];

  private cube: THREE.Mesh;
  private head: THREE.Mesh;
  private picapau: THREE.Mesh;
  private morph: number = 0;
  private shouldMorphHead;

  private frameId: number = null;

  public constructor(private ngZone: NgZone, private request: RequestService) {
  }

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    console.log(TWEEN)
    this.canvas = canvas.nativeElement;
    let group = new THREE.Group();
				group.position.y = 100;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true, // smooth edges
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.spheres = []

    // create the scene
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      30, window.innerWidth / window.innerHeight, 1, 1500
    );
    this.camera.position.set( 0, 0, 10 );
    this.scene.add(this.camera);

    // soft white light
    this.light = new THREE.AmbientLight(0xffffff, 5);
    this.light.position.z = 3;
    this.light.position.y = 3;
    this.scene.add(this.light);
    const light = new THREE.PointLight( new THREE.Color('white'), 2 );
    light.castShadow = true;
    light.position.set( 0, 3, 3 );
    this.scene.add( light );
    const texture = new TextureLoader().load('/assets/textures/neontest.jpg')
    //texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
   // const json = JSON.parse( jsonFile ); // you have to parse the data so it becomes a JS object 

    const material = new THREE.MeshLambertMaterial({color: 0x00ff00});
    const geometry = new THREE.BoxGeometry(10, 10, 1);
    
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.position.z=-10
    this.scene.add(this.cube);
    this.renderScene = new RenderPass( this.scene, this.camera );
    this.renderScene.renderToScreen = true;

    //Smoke
    const smokeGeometry = new THREE.PlaneGeometry(30, 30)
    const smokeMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('/assets/textures/clouds.png'),
      transparent: true
    });
    for (let i = 0; i < 150; i++) {
      const smokeMesh = new THREE.Mesh(smokeGeometry, smokeMaterial)
      smokeMesh.position.x = ( Math.random() - Math.random()) * 50 - 1
      smokeMesh.position.z = 2
      smokeMesh.position.y = ( Math.random() - Math.random()) * 100 - 10
      smokeMesh.rotation.z = Math.random() * 1000 - 100
      smokeMesh.material.opacity = 0.1
      this.smokeParticles.push(smokeMesh);
      //this.scene.add(smokeMesh)
    }

    this.UnrealBloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85);
    this.UnrealBloomPass.threshold = 0;
    this.UnrealBloomPass.strength = .5;
    this.UnrealBloomPass.radius = 0;
    this.UnrealBloomPass.renderToScreen = true;

    //Head
    const loader = new GLTFLoader();
    loader.load( 'assets/models/Ciana.glb',(gltf) => {
      gltf.scene.position.set(0, -15,0)
      this.head = gltf.scene.children[0] as THREE.Mesh;
      this.scene.add( gltf.scene );
      console.log(this.head.geometry.isBufferGeometry);
      this.head.morphTargetInfluences[0] = 1
      this.head.visible = false;
      const position = this.head.geometry.attributes.position;
      const vector = new THREE.Vector3();
      for ( let i = 0, l = position.count; i < l; i ++ ) {
        vector.fromBufferAttribute( position, i );
        vector.applyMatrix4( this.head.matrixWorld );
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(.006), new THREE.MeshStandardMaterial({color: new THREE.Color(0xffffff)}));
        sphere.position.set(vector.x , vector.y - 15, vector.z)
        this.scene.add(sphere)
        this.spheres.push(sphere)
        //console.log(vector); 
      }
      //this.head.morphTargetInfluences[0] = this.morph
      const headMaterial = new THREE.MeshStandardMaterial;
      headMaterial.wireframe = true;
      headMaterial.color = new THREE.Color(0xFFFFFF);
      (this.head.material as THREE.MeshStandardMaterial).wireframe = true;

    }, undefined, function ( error ) {

      console.error( error );

    } );

    loader.load( 'assets/models/Ciana.glb',(gltf) => {
      gltf.scene.position.set(2, -15,0)
      this.picapau = gltf.scene.children[0] as THREE.Mesh;
      this.scene.add( gltf.scene );
      this.picapau.visible = false;
      (this.picapau.material as THREE.MeshStandardMaterial).wireframe = true

    }, undefined, function ( error ) {

      console.error( error );

    } );

    /* this.copyPass = new ShaderPass( THREE.ShaderMaterial)
    this.copyPass.renderToScreen = true; */

		this.composer = new EffectComposer( this.renderer );
		this.composer.addPass( this.renderScene );
		this.composer.addPass( this.UnrealBloomPass );
    //this.composer.addPass( this.copyPass );
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.renderToScreen = true;
    this.material = new THREE.MeshLambertMaterial( {
      //map: texture,
      color: new THREE.Color('blue')
    } );
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

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    TWEEN.update();

    this.renderer.render(this.scene, this.camera);
    //this.composer.render( 0.05 )
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public morphHead() {
  /*   this.morph = this.morph + 0.1;
    this.morph > 1 ? this.morph = 0 : '';
    this.head.morphTargetInfluences[0] = this.morph */
    
    /* this.spheres.forEach((v,i,a) => {
      var tween = new TWEEN.Tween(v.position).to(v.position.set(0,0,0), 20000);
      tween.easing(TWEEN.Easing.Elastic.InOut)
    }) */
    console.log(this.shouldMorphHead)
    if(!this.shouldMorphHead) {
      const vector = new THREE.Vector3();
      const position = this.head.geometry.attributes.position;
      for ( let i = 0, l = position.count; i < l; i ++ ) {
        vector.fromBufferAttribute( position, i );
        vector.applyMatrix4( this.head.matrixWorld );
        new TWEEN.Tween( this.spheres[i].position )
						.to( {
							x: 0,
							y: 0,
							z: 0
						}, Math.random() * 2000 )
						.easing( TWEEN.Easing.Exponential.InOut )
						.start();

        //this.spheres[i].position.set(vector.x , vector.y, vector.z)
      }
      setTimeout(() => {
        this.transition(this.head)
      }, 2000);
      this.shouldMorphHead = true;
      return;
    }
    if(this.shouldMorphHead) {
      const vector = new THREE.Vector3();
      const position = this.picapau.geometry.attributes.position;
      for ( let i = 0, l = position.count; i < l; i ++ ) {
        vector.fromBufferAttribute( position, i );
        vector.applyMatrix4( this.picapau.matrixWorld );
        new TWEEN.Tween( this.spheres[i].position )
						.to( {
							x: 0,
							y: 0,
							z: 0
						}, Math.random() * 2000 )
						.easing( TWEEN.Easing.Exponential.InOut )
						.start();
      }
      setTimeout(() => {
        this.transition(this.picapau)
      }, 2000);
      this.shouldMorphHead = false
    }
  }
  private transition(target: THREE.Mesh) {
    console.log('transition')
    const vector = new THREE.Vector3();
      const position = target.geometry.attributes.position;
      for ( let i = 0, l = position.count; i < l; i ++ ) {
        vector.fromBufferAttribute( position, i );
        vector.applyMatrix4( target.matrixWorld );
        new TWEEN.Tween( this.spheres[i].position )
						.to( {
							x: vector.x,
							y: vector.y,
							z: vector.z
						}, Math.random() * 2000 )
						.easing( TWEEN.Easing.Exponential.InOut )
						.start();
    }
  }
  private saveAsImage(text: string) {
    var imgData; //Image data as base 64

    try {
        var strMime = "image/jpeg";
        imgData = this.renderer.domElement.toDataURL(strMime);
        this.saveFile(imgData.replace(strMime, "image/octet-stream"),text + ".jpg");
    } catch (e) {
        console.log(e);
        return;
    }
  }
  private saveFile(strData, filename) {
    this.request.saveImage('1736253', strData)
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace('uri');
    }
}
}
