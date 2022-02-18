import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {EngineService} from './engine.service';

@Component({
  selector: 'app-engine',
  templateUrl: './engine.component.html'
})
export class EngineComponent implements OnInit {

  @ViewChild('rendererCanvas', {static: true})
  public rendererCanvas: ElementRef<HTMLCanvasElement>;


  public constructor(private engServ: EngineService) {
  }

  public ngOnInit(): void {
   /*  this.clicked = false;
    this.route.queryParams
      .subscribe(params => {
        if(params.id) {
          localStorage.setItem('id', params.id) 
        } else {
          let block = document.getElementById('no-id')
          block.setAttribute('style', 'position: absolute; display: flex; top: 0; width: 100vw; height: 100vh; flex-direction: column; z-index: 10;')
          localStorage.setItem('id', '')
        }

      }
    ); */
    this.engServ.createScene(this.rendererCanvas);
    this.engServ.animate();
    //this.request.checkUser();
  }

  async saveText() {
    this.engServ.morphHead();
  }

}
