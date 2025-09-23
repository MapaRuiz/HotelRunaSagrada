import { Component } from '@angular/core';
import { RoomsTableComponent } from "./room-table/room-table";

@Component({
  selector: 'app-room',
  imports: [RoomsTableComponent],
  templateUrl: './room.html',
  styleUrl: './room.css'
})
export class Room {

}
