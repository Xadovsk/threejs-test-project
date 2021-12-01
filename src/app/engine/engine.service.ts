import * as THREE from 'three';
import {ElementRef, Injectable, NgZone, OnDestroy} from '@angular/core';
import { FontLoader, TextBufferGeometry, TextGeometry, TextureLoader } from 'three';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'

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

  private cube: THREE.Mesh;

  private frameId: number = null;

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
    let group = new THREE.Group();
				group.position.y = 100;


    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      30, window.innerWidth / window.innerHeight, 1, 1500
    );
    this.camera.position.set( 0, 0, 100 );
    this.scene.add(this.camera);

    // soft white light
    this.light = new THREE.AmbientLight(0xffffff, 0.5);
    this.light.position.z = -10;
    this.scene.add(this.light);
    const light = new THREE.PointLight( new THREE.Color('white'), 10, 100 );
    light.castShadow = true;
    light.position.set( 0, 0, 10 );
    this.scene.add( light );
    const texture = new TextureLoader().load('/assets/textures/neontest.jpg')
    //texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    const renderScene = new RenderPass( this.scene, this.camera );

    const bloomPass = new BloomPass( 1.5, 4, 85 );

				this.composer = new EffectComposer( this.renderer );
				this.composer.addPass( renderScene );
				this.composer.addPass( bloomPass );
        this.material = new THREE.MeshLambertMaterial( {
          map: texture,
        } );
   // const json = JSON.parse( jsonFile ); // you have to parse the data so it becomes a JS object 

    const material = new THREE.MeshLambertMaterial({color: 0x00ff00});
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    this.cube = new THREE.Mesh(geometry, material);
    this.createText('TESTE')
    //this.scene.add(group);

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

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);
    this.composer.render()
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public createText(text: string) {
    this.scene.remove(this.mesh)
    const loader = new FontLoader();
				loader.load( '/assets/font.typeface.json', ( font: THREE.Font ) => {
          let textGeo = new TextBufferGeometry( text, {
            font: font,
            size: 10,
            height: 5,
          } );
          textGeo.computeBoundingBox();
          textGeo.center();
          this.mesh = new THREE.Mesh( textGeo, this.material );
          this.mesh.castShadow = true;
          //this.camera.lookAt(mesh.position)
          this.scene.add( this.mesh );
				} );
  }
}
