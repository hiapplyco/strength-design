
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, 
  BarChart3, 
  Users, 
  Clock, 
  Share2, 
  LineChart, 
  Layers, 
  Zap,
  ChevronRight
} from "lucide-react";

export default function MoVAPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1a237e] pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-gradient-to-r from-[#1a237e] to-[#283593] flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://gorhody.com/images/2024/9/26/websize-fuchs.png')] bg-cover bg-center" />
        </div>
        <div className="container mx-auto px-4 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              MoVA
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Motion Video Analysis Platform for sports performance and biomechanics assessment
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-[#42a5f5] hover:bg-[#2196f3]">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Analysis Tools</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced video analysis capabilities for coaches, trainers, and sports performance professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Video className="h-10 w-10 text-[#42a5f5]" />,
                title: "Video Management",
                description: "Upload, organize and manage videos from multiple sources"
              },
              {
                icon: <Layers className="h-10 w-10 text-[#42a5f5]" />,
                title: "Analysis Tools",
                description: "Frame-by-frame controls with powerful drawing and measurement tools"
              },
              {
                icon: <LineChart className="h-10 w-10 text-[#42a5f5]" />,
                title: "Biomechanics Assessment",
                description: "Track joint angles and movement paths with precision"
              },
              {
                icon: <BarChart3 className="h-10 w-10 text-[#42a5f5]" />,
                title: "Performance Metrics",
                description: "Custom metrics creation and comprehensive benchmarking"
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interface Preview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold mb-4">Intuitive User Interface</h2>
              <p className="text-lg text-gray-600 mb-6">
                Clean, minimalist design focused on enhancing the analysis experience with:
              </p>
              <ul className="space-y-4">
                {[
                  "Focused views highlighting video content and analysis",
                  "Intuitive icon system for common actions",
                  "Interactive charts with detailed metrics",
                  "Customizable dashboard layouts"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="rounded-full bg-[#42a5f5] p-1 mr-3 mt-1">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2">
              <Card className="overflow-hidden border-none shadow-xl">
                <div className="bg-[#1a237e] text-white py-3 px-4 flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-grow text-center text-sm font-mono">Video Analysis Workspace</div>
                </div>
                <div className="h-64 bg-[#F5F7FA] p-4">
                  <div className="h-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    UI Preview Image
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Key Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-8 w-8 text-[#42a5f5]" />,
                title: "Improved Performance",
                description: "Identify technique issues and track progress over time"
              },
              {
                icon: <Users className="h-8 w-8 text-[#42a5f5]" />,
                title: "Team Collaboration",
                description: "Share analyses and insights with coaches and athletes"
              },
              {
                icon: <Clock className="h-8 w-8 text-[#42a5f5]" />,
                title: "Time Saving",
                description: "Automated tracking and analysis tools speed up workflow"
              }
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Users Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Who It's For</h2>
            <p className="text-lg text-gray-600">Designed for professionals in sports and rehabilitation</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              "Sports Performance Trainers",
              "Physical Therapists",
              "Strength & Conditioning Coaches", 
              "Team Sports Organizations",
              "Individual Athletes",
              "Biomechanics Researchers"
            ].map((user, index) => (
              <Card key={index} className="p-4 text-center hover:bg-blue-50 transition-colors">
                <p className="font-medium">{user}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Implementation Plan</h2>
          
          <div className="max-w-4xl mx-auto">
            {[
              {
                phase: "Phase 1: Core Platform",
                timeline: "Months 1-2",
                features: [
                  "Basic user authentication and profiles",
                  "Video upload and management system",
                  "Simple video player with frame controls",
                  "Initial drawing and measurement tools",
                  "Basic athlete profiles"
                ]
              },
              {
                phase: "Phase 2: Analysis Features",
                timeline: "Months 3-4",
                features: [
                  "Advanced video controls and manipulation",
                  "Complete suite of measurement tools",
                  "Side-by-side comparison functionality",
                  "Basic automated joint tracking",
                  "Initial metrics and reporting"
                ]
              },
              {
                phase: "Phase 3: Advanced Analytics",
                timeline: "Months 5-6",
                features: [
                  "AI-powered movement analysis",
                  "Comprehensive biomechanical metrics",
                  "Custom scoring and assessment tools",
                  "Expanded visualization options",
                  "Performance trending and tracking"
                ]
              },
              {
                phase: "Phase 4: Collaboration & Integration",
                timeline: "Months 7-8",
                features: [
                  "Team collaboration features",
                  "Client/athlete portal",
                  "External system integrations",
                  "Advanced reporting and exports",
                  "Mobile app development"
                ]
              }
            ].map((phase, index) => (
              <Card key={index} className="mb-8 overflow-hidden">
                <div className="bg-[#1a237e] text-white p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">{phase.phase}</h3>
                    <span className="text-sm bg-[#42a5f5] px-3 py-1 rounded-full">{phase.timeline}</span>
                  </div>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {phase.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <ChevronRight className="h-5 w-5 text-[#42a5f5] mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-[#1a237e] to-[#283593] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Enhance Your Analysis Capabilities?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Join the MoVA platform and transform how you analyze athletic performance
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-[#42a5f5] hover:bg-[#2196f3]">
              Request Early Access
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
