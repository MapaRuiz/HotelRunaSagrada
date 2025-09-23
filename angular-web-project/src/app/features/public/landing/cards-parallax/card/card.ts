import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { NgStyle } from '@angular/common'; 
@Component({
	selector: 'app-card',
	standalone: true, 
	imports: [CommonModule], 
	template: `
		<div class="card-container">
			<div class="card" [style.backgroundColor]="color">
				<span class="card-title">
					<span class="font-tiemposHeadline" [style.color]="textColor">
						{{ title }}
					</span>
				</span>
				<div class="card-description" [style.color]="textColor">
					{{ description }}
				</div>
				<div class="card-image-container">
					<img class="card-image" [src]="src" alt="Background" />
				</div>
			</div>
		</div>
	`,
	styleUrls: ['./card.css'],
})
export class CardComponent {
	@Input() title!: string;
	@Input() description!: string;
	@Input() color!: string;
	@Input() textColor!: string;
	@Input() src!: string;
	@Input() i!: number;
}