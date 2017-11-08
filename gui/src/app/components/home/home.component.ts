import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  title = `App works ! - Hamza`;
  shares = [];

  constructor() {
     this.shares = [
      {
        id: 1,
        name: 'My Share',
        url: 'https://iogates.com',
        token: '1234',
        direction: 'upload',
        dir: 'upload',
        created: '2017-10-19 14:33:39.661 +00:00'
      }
    ]
  }

  ngOnInit() {
  }

}
