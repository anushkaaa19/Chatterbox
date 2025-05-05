import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

const GetStartedSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4 md:py-24">
      <div className="container mx-auto max-w-4xl bg-gray-800 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of users already enjoying ChatterBox. Create an account in seconds and start chatting!
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg"  onClick={() => navigate('/signup')} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            Sign Up Free
          </Button>
          <Button size="lg" variant="outline"  onClick={() => navigate('/demo')} className="border-amber-500 text-amber-500 hover:bg-amber-500/10">
            View Demo
          </Button>
        </div>
        <p className="text-gray-400 mt-6">
          No credit card required. Free plan includes all essential features.
        </p>
      </div>
    </section>
  );
};

export default GetStartedSection;
