import { Component } from '@angular/core';
import { RoomTypesTableComponent } from "./room-type-table/room-type-table";

@Component({
  selector: 'app-room-type',
  imports: [RoomTypesTableComponent],
  templateUrl: './room-type.html',
  styleUrl: './room-type.css'
})
export class RoomType {

}
