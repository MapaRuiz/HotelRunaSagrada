import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials-section.html',
  styleUrls: ['./testimonials-section.css']
})
export class TestimonialsSection {
  testimonials = [
    {
      text: "The support team is exceptional, guiding us through setup and providing ongoing assistance, ensuring our satisfaction.",
      img: "https://randomuser.me/api/portraits/women/44.jpg",
      name: "Saman Malik",
      role: "Customer Support Lead"
    },
    {
      text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance.",
      img: "https://randomuser.me/api/portraits/women/65.jpg",
      name: "Aliza Khan",
      role: "Business Analyst"
    },
    {
      text: "Using this ERP, our online presence and conversions significantly improved, boosting business performance.",
      img: "https://randomuser.me/api/portraits/men/32.jpg",
      name: "Hassan Ali",
      role: "E-commerce Manager"
    },
    {
      text: "This ERP revolutionized our operations, streamlining finance and inventory. The cloud-based platform keeps us productive, even remotely.",
      img: "https://randomuser.me/api/portraits/women/68.jpg",
      name: "Briana Patton",
      role: "Operations Manager"
    },
    {
      text: "This ERP's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive interface.",
      img: "https://randomuser.me/api/portraits/men/41.jpg",
      name: "Farhan Siddiqui",
      role: "Marketing Director"
    },
    {
      text: "They delivered a solution that exceeded expectations, understanding our needs and enhancing our operations.",
      img: "https://randomuser.me/api/portraits/women/71.jpg",
      name: "Sana Sheikh",
      role: "Sales Manager"
    }
  ];
}
