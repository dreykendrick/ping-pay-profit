import { Check, ArrowRight, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, fair pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pricing is set during setup based on your region. No hidden fees, no surprises.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative p-8 bg-card rounded-3xl border border-border hover:border-primary/30 hover:shadow-premium-xl transition-all duration-300">
            {/* Featured badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                <Globe className="w-4 h-4" />
                Available Worldwide
              </div>
            </div>

            <div className="text-center mb-8 pt-4">
              <h3 className="text-2xl font-bold mb-2">PayPing Pro</h3>
              <p className="text-muted-foreground">
                Everything you need to stay on top of follow-ups
              </p>
            </div>

            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">Starting at</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">$10</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Final pricing based on your region
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span>Unlimited clients</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span>Unlimited reminders</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span>WhatsApp + Email templates</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span>Automatic email reminders</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span>7-day money-back guarantee</span>
              </li>
            </ul>

            <Button asChild className="w-full rounded-xl py-6 text-lg group">
              <Link to="/auth">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            {/* Trust badges */}
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Multiple payment options available • Secure checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
