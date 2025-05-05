import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { MessageSquare, Shield, Zap, Users } from "lucide-react";

const features = [
  {
    title: "Real-time Messaging",
    description: "Send and receive messages instantly with friends and colleagues.",
    icon: MessageSquare,
  },
  {
    title: "Secure by Default",
    description: "End-to-end encryption ensures your conversations remain private.",
    icon: Shield,
  },
  {
    title: "Lightning Fast",
    description: "Built for speed and reliability, even on slower connections.",
    icon: Zap,
  },
  {
    title: "Group Chats",
    description: "Create groups for teams, friends, or any gathering.",
    icon: Users,
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 px-4 bg-gray-900">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
          Why Choose <span className="text-amber-500">ChatterBox</span>?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-gray-800 border-gray-700 hover:border-amber-500/50 transition-colors"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
