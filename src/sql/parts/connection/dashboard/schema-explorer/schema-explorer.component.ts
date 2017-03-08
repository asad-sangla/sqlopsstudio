import { OnInit } from '@angular/core';

declare let AngularCore;

@AngularCore.Component({
  selector: 'schema-explorer',
  templateUrl: require.toUrl('sql/parts/connection/dashboard/schema-explorer/schema-explorer.component.html'),
  styleUrls: [ require.toUrl('sql/parts/connection/dashboard/schema-explorer/schema-explorer.component.css') ]
})
export class SchemaExplorerComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
