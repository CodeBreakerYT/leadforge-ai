import LeadForm from '@/components/LeadForm';
import { Shield, Zap, Target, BarChart3, ChevronRight, Mail } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            LeadForge AI
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#workflow" className="hover:text-white transition-colors">How it works</a>
          <a href="/admin" className="hover:text-white transition-colors">Login</a>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Now with Gemini 1.5 Flash
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                Automate Your <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  Lead Generation
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                Instantly capture leads, scrape their websites, and automatically send them highly personalized, AI-generated technical growth audits. 
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <a href="#demo" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
                  Try it now
                  <ChevronRight className="w-4 h-4" />
                </a>
                <a href="#workflow" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors border border-slate-700">
                  See how it works
                </a>
              </div>
            </div>

            <div className="flex-1 w-full" id="demo">
              <LeadForm />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-900 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything you need to scale</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">No human intervention required. Set it up once and let our AI do the heavy lifting for your outbound pipeline.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Target className="w-8 h-8 text-blue-400" />,
                  title: "Smart Scraping",
                  desc: "We instantly crawl your prospect's website to understand their business, niche, and current technical setup."
                },
                {
                  icon: <BarChart3 className="w-8 h-8 text-indigo-400" />,
                  title: "AI-Powered Audits",
                  desc: "Google's Gemini model analyzes the data to generate personalized SEO, UX, and growth recommendations."
                },
                {
                  icon: <Mail className="w-8 h-8 text-purple-400" />,
                  title: "Automated Delivery",
                  desc: "Beautiful PDF reports are generated, backed up to Drive, and emailed directly to your prospect in seconds."
                }
              ].map((feature, idx) => (
                <div key={idx} className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="mb-4 bg-slate-900 w-14 h-14 rounded-xl flex items-center justify-center border border-slate-700">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-slate-950 text-center text-slate-500">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-300">LeadForge AI</span>
          </div>
          <p>&copy; {new Date().getFullYear()} LeadForge AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
