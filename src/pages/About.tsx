import { Youtube, Brain, MessageSquare, Clock, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Summaries',
      description: 'Advanced ChatGPT-4o-mini model analyzes video content and provides concise, intelligent summaries in 2-3 main paragraphs.'
    },
    {
      icon: MessageSquare,
      title: 'Interactive Chat',
      description: 'Ask detailed questions about any video after summarization. Get specific insights and dive deeper into the content.'
    },
    {
      icon: Clock,
      title: 'Complete History',
      description: 'Access all your past summaries and chat conversations anytime. Never lose track of important video insights.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get comprehensive video summaries in seconds. Save hours of watching time while staying informed.'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data is secure and private. We process video content efficiently without storing personal information.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-brand-accent rounded-3xl flex items-center justify-center shadow-large">
              <Youtube className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading text-brand-primary mb-6">
            About YT Summarizer
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Transform how you consume YouTube content with AI-powered summaries and intelligent conversations about any video.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 shadow-medium">
          <CardContent className="py-12 px-8 text-center">
            <h2 className="text-3xl font-heading text-brand-primary mb-6">Our Mission</h2>
            <p className="text-lg text-text-primary max-w-4xl mx-auto leading-relaxed">
              We believe that valuable knowledge shouldn't be locked away in lengthy videos. Our platform empowers you to quickly understand video content, engage with it meaningfully, and retain important insights - all while saving precious time in your busy schedule.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-heading text-brand-primary text-center mb-12">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-brand-accent" />
                    </div>
                    <CardTitle className="text-xl text-brand-primary">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary text-center">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <Card className="mb-16 shadow-medium">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-brand-primary mb-6">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-heading text-white">1</span>
                </div>
                <h3 className="text-xl font-heading text-brand-primary mb-3">Paste URL</h3>
                <p className="text-text-secondary">Simply paste any YouTube video URL into our analyzer.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-heading text-white">2</span>
                </div>
                <h3 className="text-xl font-heading text-brand-primary mb-3">AI Analysis</h3>
                <p className="text-text-secondary">Our AI processes the content and generates a comprehensive summary.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-heading text-white">3</span>
                </div>
                <h3 className="text-xl font-heading text-brand-primary mb-3">Ask & Learn</h3>
                <p className="text-text-secondary">Chat with AI about the video to get deeper insights and answers.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology */}
        <div className="text-center">
          <h2 className="text-3xl font-heading text-brand-primary mb-8">Built with Advanced AI</h2>
          <p className="text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed mb-8">
            Powered by OpenRouter's ChatGPT-4o-mini model, our platform delivers accurate, contextual summaries and enables natural conversations about video content. Experience the future of content consumption today.
          </p>
          <div className="flex justify-center">
            <Card className="inline-block shadow-soft">
              <CardContent className="px-6 py-4">
                <p className="text-sm text-text-muted">
                  <span className="font-medium text-brand-primary">Powered by:</span> OpenRouter & ChatGPT-4o-mini
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;