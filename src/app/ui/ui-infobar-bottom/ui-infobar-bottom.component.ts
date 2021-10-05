import {Component, OnInit} from '@angular/core';
import { EngineService } from 'src/app/engine/engine.service';

@Component({
  selector: 'app-ui-infobar-bottom',
  templateUrl: './ui-infobar-bottom.component.html'
})

export class UiInfobarBottomComponent implements OnInit {

  public constructor(private engine: EngineService) {
  }

  public ngOnInit(): void {
  }

  public backButton() {
    document.getElementById('nft').setAttribute('style', 'display: none;')
    this.engine.controlsActivation(true);
  }

}
