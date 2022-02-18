import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class RequestService {

    constructor(private http: HttpClient) { }

    public async saveImage(id: string, image) {
        await this.http.post(environment.endpoint + '/artes', {data: { arteid: localStorage.getItem('id').toString(), arteUrl: '', arteBase64: image}}).toPromise()
        .then((response) => {
            console.log(response)
        })
        .catch((error) => {console.log(error)});
    }

    public async getImage() {
        await this.http.get<any>(environment.endpoint + '/artes?filters[arteid][$eq]=' + localStorage.getItem('id').toString()).toPromise()
        .then((response) => {
            let image = document.createElement('img')
            image.setAttribute('src', response.data[0].attributes.arteBase64)
            document.body.appendChild(image);
            //console.log(response)
            /* var link = document.createElement('a');
            if (typeof link.download === 'string') {
                document.body.appendChild(link); //Firefox requires the link to be in the body
                link.download = 'filename';
                link.href = response.data[0].attributes.arteBase64;
                link.click();
                document.body.removeChild(link); //remove the link when done
            } else {
                location.replace('uri');
            } */
        })
        .catch((error) => {console.log(error)});
    }

    public async checkUser() {
        await this.http.get<any>(environment.endpoint + '/artes?filters[arteid][$eq]=' + localStorage.getItem('id').toString()).toPromise()
        .then((response) => {
            console.log(response.data.length);
            if(response.data.length >= 1) {
                let block = document.getElementById('block')
                block.setAttribute('style', 'position: absolute; display: flex; top: 0; width: 100vw; height: 100vh; flex-direction: column; z-index: 10;')
            }
        })
        .catch((error) => {console.log(error)});
    }
}
