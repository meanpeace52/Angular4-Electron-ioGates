import { FilesResponse, Share, File } from '../../shared/types';
import { ApiService } from '../../providers/api.service';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'aapp-shareview',
  templateUrl: './shareview.component.html',
  styleUrls: ['./shareview.component.css']
})
export class ShareViewComponent implements OnInit {
  // share: Share = <Share>{
  //   id: 1,
  //   name: 'My Share',
  //   url: 'https://iogates.com',
  //   token: '1234',
  //   direction: 'upload',
  //   dir: 'upload',
  //   created: '2017  -10-19 14:33:39.661 +00:00'
  // };
  share: Share = new Share();

  nodes: File[] = [];

  constructor(
    private router: ActivatedRoute,
    private api: ApiService
  ) {
  }

  ngOnInit() {
    console.log('run onInit...');
    this.retrieveFiles();
  }

  private retrieveFiles() {
    console.log('running...');
    return this
      .api
      .getFiles()
      .then((response: FilesResponse) => {
        console.log('>>', response.files);
        this.share.files = response.files;
      });
  }

}
