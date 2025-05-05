import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4 md:py-24 md:px-8 lg:py-32 text-center">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-center mb-6">
          <MessageSquare className="h-16 w-16 text-amber-500" />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          Connect and Chat with <span className="text-amber-500">ChatterBox</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          The modern messaging platform that makes staying connected with friends, family, and colleagues simple and enjoyable.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            onClick={() => navigate('/signup')}
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
            onClick={() => navigate('/learn')}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;