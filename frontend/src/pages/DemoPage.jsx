import React from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { MessageSquare, Users } from 'lucide-react';
import { Separator } from '../components/ui/separator'; // Add this import

const DemoPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // This will take the user back to the previous page
  };

  return (
    <div className="flex flex-col min-h-screen bg-chat-dark">
      <main className="flex-1 py-16 px-4 md:py-24">
        <div className="container mx-auto max-w-4xl">
          <Button
            onClick={handleBack}
            variant="outline"
            className="mb-8 border-amber-500 text-amber-500 hover:bg-amber-500/10"
          >
            Back to Home
          </Button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            <span className="text-amber-500">ChatterBox</span> Demo
          </h1>
          
          <div className="bg-gray-800 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Interactive Demo</h2>
            
            <div className="bg-gray-900 rounded-xl p-6 mb-8">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-black" />
                </div>
                <div className="ml-4">
                  <h3 className="text-white font-medium">ChatterBox Assistant</h3>
                  <p className="text-gray-400 text-sm">Online</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 max-w-xs ml-auto">
                  <p className="text-gray-300">How does ChatterBox work?</p>
                </div>
                
                <div className="bg-amber-500/20 rounded-lg p-4 max-w-sm">
                  <p className="text-gray-200">
                    ChatterBox allows you to message anyone instantly! Create an account, add friends,
                    and start chatting. You can also create group chats for teams or events.
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 max-w-xs ml-auto">
                  <p className="text-gray-300">Is it secure?</p>
                </div>
                
                <div className="bg-amber-500/20 rounded-lg p-4 max-w-sm">
                  <p className="text-gray-200">
                    Absolutely! We use end-to-end encryption to ensure your messages can only be read by
                    you and the intended recipients. Your privacy is our top priority.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent px-4 py-3 text-white focus:outline-none"
                  disabled
                />
                <Button className="bg-amber-500 hover:bg-amber-600 px-4 py-3 text-black">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={() => navigate('/signup')}
            >
              Sign Up for Full Access
            </Button>
            <p className="text-gray-400 mt-4">
              No credit card required. Free plan includes all essential features.
            </p>
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
                <a href="#" className="text-amber-500 hover:text-amber-400">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-amber-500 hover:text-amber-400">
                  <span className="sr-only">GitHub</span>
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

export default DemoPage;
