import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, name, role, rating }) => {
  return (
    <Card className="bg-neutral border-none">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="text-yellow-400 flex">
            {[...Array(5)].map((_, i) => (
              <i 
                key={i} 
                className={`fas ${i < rating ? 'fa-star' : i === Math.floor(rating) && rating % 1 !== 0 ? 'fa-star-half-alt' : 'fa-star'}`}
              ></i>
            ))}
          </div>
        </div>
        <p className="text-gray-600 mb-6">
          {quote}
        </p>
        <div className="flex items-center">
          <div className="bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center mr-4">
            <i className="fas fa-user text-gray-500"></i>
          </div>
          <div>
            <h4 className="font-semibold">{name}</h4>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      quote: "Desde que implementei o Preskriptor, ganhei horas preciosas e tenho ainda mais segurança nas minhas prescrições. Meus pacientes notaram a agilidade.",
      name: "Dra. Carolina Almeida",
      role: "Endocrinologista",
      rating: 5
    },
    {
      quote: "A plataforma é incrivelmente intuitiva e as sugestões são sempre alinhadas com as melhores práticas. Um divisor de águas!",
      name: "Dr. Ricardo Esteves",
      role: "Nutrólogo",
      rating: 5
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Aprovado por Quem Entende</h2>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              role={testimonial.role}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
