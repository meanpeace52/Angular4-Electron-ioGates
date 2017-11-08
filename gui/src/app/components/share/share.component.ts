import { Component, OnInit, Input } from '@angular/core';
import { File, Share } from '../../shared/types';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss']
})
export class ShareComponent implements OnInit {
  @Input() share: Share;
  nodes: Array<object> = [];
  showShareMenu = false;
  showShareSettings = false;

  constructor() {
    this.nodes = [
      {
        id: 1,
        name: 'Shared folder name here',
        type: 'dir',
        created: '2017-10-19 14:33:39.894 +00:00'
      },
      {
        id: 2,
        name: 'Movie File',
        type: 'movie',
        created: '2017-10-19 14:33:39.894 +00:00'
      }
    ];
  }

  ngOnInit() {
    // console.log('Files Received: ', this.share.files  )
    // this.nodes = this.share.files;
  }

}
