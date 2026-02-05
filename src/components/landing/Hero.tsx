import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.png';
import paypingLogo from '@/assets/payping-logo.png';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-fade-up">
            <img src={paypingLogo} alt="" className="w-4 h-4" />
            <span className="text-sm font-medium">Built for small business owners</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Stop forgetting follow-ups.{' '}
            <span className="text-gradient">Stop losing money.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            PayPing shows you who to message today and what to say — so clients don't slip through. One tap to copy, one tap to send.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-2xl shadow-glow hover:shadow-xl transition-all duration-300">
              <Link to="/auth">
                Get Access
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 rounded-2xl">
              <Link to="/auth?mode=login">
                View Dashboard Demo
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-16 pt-8 border-t border-border/50 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm text-muted-foreground mb-4">Trusted by small teams across the globe</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="text-xl font-semibold">Freelancers</div>
              <div className="w-px h-6 bg-border" />
              <div className="text-xl font-semibold">Agencies</div>
              <div className="w-px h-6 bg-border" />
              <div className="text-xl font-semibold">Consultants</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
