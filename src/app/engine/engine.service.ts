import * as THREE from 'three';
import {ElementRef, Injectable, NgZone, OnDestroy} from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { MOUSE } from 'three';

@Injectable({providedIn: 'root'})
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;

  private cube: THREE.Mesh;
  private cube2: THREE.Mesh;
  private cube3: THREE.Mesh;

  private clock = new THREE.Clock();

  private frameId: number = null;

  private controls: FirstPersonControls;

  public constructor(private ngZone: NgZone) {
  }

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 1, 10000
    );
    //this.camera.position.z = 5;
    this.camera.position.z = 5;
    this.scene.add(this.camera);

    // soft white light
    this.light = new THREE.AmbientLight(0x404040);
    this.light.position.z = 10;
    this.scene.add(this.light);

    //const texture = new THREE.TextureLoader().load( "assets/textures/yveltal.png" );
    const texture = new THREE.TextureLoader().load( "https://1.bp.blogspot.com/-Amtf96EIKqE/YNIfb-CgJkI/AAAAAAAATlo/X0nbEOwOQLMhaR-Ea9nOUXrGso47Q0OigCLcBGAsYHQ/s776/absol.png" );
    //const texture2 = new THREE.TextureLoader().load( "https://i.pinimg.com/originals/20/1c/8b/201c8bb923fa4d5088be7f63c0649585.jpg" );
    //const texture3 = new THREE.TextureLoader().load( "https://img.elo7.com.br/product/zoom/14828CC/mega-charizard-x-garra-do-dragao-geek.jpg" );
  

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const geometry2 = new THREE.PlaneGeometry( 1, 1 );
    const geometry3 = new THREE.BoxGeometry(1, 0.5, 1);
    const material = new THREE.MeshBasicMaterial( {map: texture} );
    const material2 = new THREE.MeshBasicMaterial( {map: texture} );
    const material3 = new THREE.MeshBasicMaterial( {map: texture} );
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.position.set(2, 0, 0);
    this.cube2 = new THREE.Mesh(geometry2, material2);
    this.cube2.position.set(-2, 0, 0);
    this.cube3 = new THREE.Mesh(geometry3, material3);
    const group = new THREE.Group()
    group.add(this.cube);
    group.add(this.cube2);
    group.add(this.cube3);
    this.scene.add(group);

    // this.controls = new FirstPersonControls(this.camera, document.getElementById('FPS'));
    this.controls = new FirstPersonControls(this.camera, this.renderer.domElement);
    this.controls.activeLook = true;
    this.controls.movementSpeed = 1;
		this.controls.lookSpeed = 0.1;
    //this.controls.lookAt()
    console.log(this.controls);
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

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    //this.cube.rotation.x += 0.01;
    //this.cube.rotation.y += 0.01;
    this.controls.update(this.clock.getDelta());
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }
}
