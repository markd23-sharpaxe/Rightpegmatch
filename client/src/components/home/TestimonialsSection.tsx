import { Star, StarHalf } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  image: string;
  text: string;
  stars: number;
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      name: "Sarah J.",
      role: "UX Designer",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150",
      text: "RemoteMatch helped me find a role that perfectly fits my schedule as a parent. I work with a team across three time zones, and our availability matcher made it seamless.",
      stars: 5
    },
    {
      name: "Miguel R.",
      role: "Full-Stack Developer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150",
      text: "As a digital nomad, finding work that accommodates my changing time zones was challenging until I discovered RemoteMatch. Now I can travel and work seamlessly.",
      stars: 4.5
    },
    {
      name: "David T.",
      role: "Tech Startup Founder",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150",
      text: "Building our remote team was a challenge until we used RemoteMatch. The time zone compatibility feature helped us build a global team that collaborates effectively.",
      stars: 5
    }
  ];
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="fill-primary text-primary" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="fill-primary text-primary" />);
    }
    
    return stars;
  };
  
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-inter font-semibold text-3xl mb-12 text-center">Success Stories</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-neutral-100 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div>
                  <h3 className="font-medium">{testimonial.name}</h3>
                  <p className="text-sm text-neutral-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-neutral-700 mb-4">
                "{testimonial.text}"
              </p>
              <div className="flex text-primary">
                {renderStars(testimonial.stars)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
