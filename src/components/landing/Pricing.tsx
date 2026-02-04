import { Check, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/constants';

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your region. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className="relative p-8 bg-card rounded-3xl border border-border hover:border-primary/30 hover:shadow-premium-xl transition-all duration-300"
            >
              {/* Location badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm mb-6">
                <MapPin className="w-4 h-4" />
                {plan.id === 'US' ? 'United States' : 'East Africa'}
              </div>

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-muted-foreground mb-6">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success" />
                  <span>Unlimited reminders</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success" />
                  <span>WhatsApp + Email templates</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success" />
                  <span>7-day money-back guarantee</span>
                </li>
              </ul>

              <Button asChild className="w-full rounded-xl py-6 text-lg">
                <Link to="/auth">Get Started</Link>
              </Button>

              {/* Payment methods */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Pay with:</p>
                <p className="text-sm">
                  {plan.paymentMethods.map((m) => m.name).join(' • ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
