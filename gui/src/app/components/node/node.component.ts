import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class NodeComponent implements OnInit {
  @Input() node: object;
  constructor() { }

  ngOnInit() {
    console.log('>', this.node);
  }

}
