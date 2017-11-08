import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-shares',
  templateUrl: './shares.component.html',
  styleUrls: ['./shares.component.css']
})
export class SharesComponent implements OnInit {

  shares: Set<string> = new Set();
  shareName: string = '';

  constructor() {
    this.shares.add('My share');
    this.shares.add('Another share');
    this.shares.add('Just another share ;)');
  }

  ngOnInit() {
  }

  addShare() {
    if (this.shareName) {
      this.shares.add(this.shareName);
    }
  }

  removeShare() {
    this.shares.delete(Array.from(this.shares.values()).pop());
  }

}
