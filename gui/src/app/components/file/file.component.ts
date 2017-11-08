import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss']
})
export class FileComponent implements OnInit {
  type = 'movie';
  name = 'My File.mp4'

  constructor() { }

  ngOnInit() {
  }

}
