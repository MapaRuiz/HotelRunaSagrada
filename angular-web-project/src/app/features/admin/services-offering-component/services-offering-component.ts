import { Component } from '@angular/core';
import { ServicesTable } from "./services-table/services-table";
import { ServicesTableTest } from './services-table-test/services-table-test';

@Component({
  selector: 'app-services-offering-component',
  imports: [ServicesTableTest],
  templateUrl: './services-offering-component.html',
  styleUrl: './services-offering-component.css'
})
export class ServicesOfferingComponent {

}
