export default function RemoteWorkplaceSection() {
  const images = [
    {
      src: "https://images.unsplash.com/photo-1488751045188-3c55bbf9a3fa?auto=format&fit=crop&w=600&h=400",
      alt: "Person working on laptop from home office"
    },
    {
      src: "https://images.unsplash.com/photo-1593476123561-9516f2097158?auto=format&fit=crop&w=600&h=400",
      alt: "Remote worker in a cafe"
    },
    {
      src: "https://images.unsplash.com/photo-1585974738771-84483dd9f89f?auto=format&fit=crop&w=600&h=400",
      alt: "Person working poolside"
    },
    {
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&h=400",
      alt: "Team collaboration remotely"
    },
    {
      src: "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?auto=format&fit=crop&w=600&h=400",
      alt: "Digital nomad working from beach location"
    },
    {
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&h=400",
      alt: "Coworking space with remote workers"
    },
  ];
  
  return (
    <section className="py-16 bg-neutral-100">
      <div className="container mx-auto px-4">
        <h2 className="font-inter font-semibold text-3xl mb-4 text-center">Remote Work Around the World</h2>
        <p className="text-neutral-600 text-center max-w-3xl mx-auto mb-12">
          Join thousands of professionals who are building successful careers from anywhere.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="overflow-hidden rounded-lg h-64">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
