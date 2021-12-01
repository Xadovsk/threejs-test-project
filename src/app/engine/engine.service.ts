import * as THREE from 'three';
import {ElementRef, Injectable, NgZone, OnDestroy} from '@angular/core';
import { FontLoader, TextGeometry } from 'three';

@Injectable({providedIn: 'root'})
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;
  private mesh;

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
    this.light = new THREE.AmbientLight(0x404040);
    this.light.position.z = 10;
    this.scene.add(this.light);
    let jsonFile;

    const loader = new FontLoader();
				loader.load( '/assets/font.typeface.json', ( font: THREE.Font ) => {
          let textGeo = new TextGeometry( 'TESTE', {
            font: font,
            size: 10,
            height: 5,
          } );
          let material = new THREE.MeshBasicMaterial( {
                                               color      : '#FFFFFF',
                                               side       : THREE.DoubleSide
                                             } );
          this.mesh = new THREE.Mesh( textGeo, material );
          //this.camera.lookAt(mesh.position)
          this.scene.add( this.mesh );
				} );
   // const json = JSON.parse( jsonFile ); // you have to parse the data so it becomes a JS object 

    const material = new THREE.MeshLambertMaterial({color: 0x00ff00});
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    this.cube = new THREE.Mesh(geometry, material);
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
          let textGeo = new TextGeometry( text, {
            font: font,
            size: 10,
            height: 5,
          } );
          let material = new THREE.MeshBasicMaterial( {
                                               color      : '#FFFFFF',
                                               side       : THREE.DoubleSide
                                             } );
          this.mesh = new THREE.Mesh( textGeo, material );
          //this.camera.lookAt(mesh.position)
          this.scene.add( this.mesh );
				} );
  }
}
