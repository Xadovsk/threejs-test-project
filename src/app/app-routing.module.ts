import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { EngineComponent } from './engine/engine.component';
import { ImageDownloadComponent } from './image-download/image-download.component';

const routes: Routes = [
  { path: 'image', component: ImageDownloadComponent },
  { path: '**', component: EngineComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
