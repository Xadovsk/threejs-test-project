import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestService } from '../engine/requests.service';

@Component({
  selector: 'app-image-download',
  templateUrl: './image-download.component.html',
  styleUrls: ['./image-download.component.scss']
})
export class ImageDownloadComponent implements OnInit {

  constructor(private request:RequestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        params.id ? localStorage.setItem('id', params.id) : localStorage.setItem('id', '')
      }
    );
    this.request.getImage();
    //this.router.navigateByUrl('?id=' + localStorage.getItem('id').toString());
  }

}
