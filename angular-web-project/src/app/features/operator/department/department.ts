import { Component } from '@angular/core';
import { DepartmentTable } from './department-table/department-table';

@Component({
  selector: 'app-department',
  imports: [DepartmentTable],
  templateUrl: './department.html',
  styleUrl: './department.css'
})
export class DepartmentComponent {

}
