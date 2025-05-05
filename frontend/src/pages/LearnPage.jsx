import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from '../components/ui/separator';
import { MessageSquare, Shield, Zap, Users } from "lucide-react"; // Importing icons

const LearnPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1); // Navigate back to the previous page
    } else {
      navigate("/"); // If there's no history, navigate to the homepage
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-chat-dark">
      <main className="flex-1 py-16 px-4 md:py-24">
        <div className="container mx-auto max-w-4xl">
          <Button
            onClick={handleBack}
            variant="outline"
            className="mb-8 border-amber-500 text-amber-500 hover:bg-amber-500/10"
            aria-label="Back to previous page"
          >
            <ArrowLeft className="mr-2" aria-hidden="true" /> Back to Home
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            About <span className="text-amber-500">ChatterBox</span>
          </h1>

          <div className="bg-gray-800 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-gray-300 mb-6">
              At ChatterBox, we believe communication should be simple, secure, and enjoyable. 
              Our platform is designed to connect people across the globe with a seamless 
              messaging experience that prioritizes both functionality and user experience.
            </p>
            <p className="text-gray-300">
              Whether you're connecting with friends, family, or colleagues, ChatterBox provides 
              the tools you need to communicate effectively in today's fast-paced world.
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Key Benefits</h2>
            <ul className="text-gray-300 space-y-4">
              <li className="flex items-start">
                <MessageSquare className="h-6 w-6 text-amber-500 mr-3 mt-0.5" aria-hidden="true" />
                <span>End-to-end encryption for all messages and calls</span>
              </li>
              <li className="flex items-start">
                <Shield className="h-6 w-6 text-amber-500 mr-3 mt-0.5" aria-hidden="true" />
                <span>Full control over your data with advanced privacy settings</span>
              </li>
              <li className="flex items-start">
                <Zap className="h-6 w-6 text-amber-500 mr-3 mt-0.5" aria-hidden="true" />
                <span>Optimized for speed and reliability, even on low bandwidth connections</span>
              </li>
              <li className="flex items-start">
                <Users className="h-6 w-6 text-amber-500 mr-3 mt-0.5" aria-hidden="true" />
                <span>Create unlimited groups with advanced collaboration features</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={handleBack}
              aria-label="Return to homepage"
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">ChatterBox</h3>
              <p className="mb-4">The modern messaging platform for everyone.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-amber-500 hover:text-amber-400" aria-label="Twitter">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-amber-500 hover:text-amber-400" aria-label="GitHub">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Download</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-800" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} ChatterBox. All rights reserved.</p>
            <p className="mt-4 md:mt-0">Made with ❤️ by ChatterBox Team</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearnPage;
