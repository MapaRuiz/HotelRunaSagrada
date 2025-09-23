import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card/card';

interface ICardItem {
	title: string;
	description: string;
	tag: string;
	src: string;
	link: string;
	color: string;
	textColor: string;
}

@Component({
	selector: 'app-cards-parallax',
	standalone: true,
	imports: [CommonModule, CardComponent],
	templateUrl: './cards-parallax.html',
	styleUrls: ['./cards-parallax.css'],
})
export class CardsParallaxComponent {
	public hotels: ICardItem[] = [
		{
			title: 'Runa, Salento',
			description: 'Una cabaña con vista al Valle de Cocora.',
			tag: 'Hotel',
			src: 'https://images.unsplash.com/photo-1512617883304-3affd6c4b94e?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			link: '#',
			color: '#9E8B62',
			textColor: '#fff',
		},
		{
			title: 'Runa, Guatapé',
			description: 'Un retiro cerca de la represa y El Peñol.',
			tag: 'Hotel',
			src: 'https://images.unsplash.com/photo-1576018753502-1a55b66cc44a?q=80&w=1173&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			link: '#',
			color: '#BDB394',
			textColor: '#fff',
		},
		{
			title: 'Runa, Santa Marta',
			description: 'Un paraíso en la Sierra Nevada y el mar Caribe.',
			tag: 'Hotel',
			src: 'https://images.unsplash.com/photo-1626837540687-04858fcef1ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			link: '#',
			color: '#D4C6AB',
			textColor: '#fff',
		},
		{
			title: 'Runa, Eje Cafetero',
			description: 'Una finca cafetera en el corazón de la región.',
			tag: 'Hotel',
			src: 'https://images.unsplash.com/photo-1551279797-afcc03eb4217?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			link: '#',
			color: '#8D7F64',
			textColor: '#fff',
		},
		{
			title: 'Runa, Barichara',
			description: 'Una casa colonial en el pueblo más bonito de Colombia.',
			tag: 'Hotel',
			src: 'https://images.unsplash.com/photo-1645740047063-0246896f1aa9?q=80&w=1173&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			link: '#',
			color: '#A99A7D',
			textColor: '#fff',
		},
	];
}