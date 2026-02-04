import { Bell, DollarSign, MessageSquare, Mail, Users, LayoutDashboard, LucideIcon } from 'lucide-react';
import { FEATURES } from '@/lib/constants';

const iconMap: Record<string, LucideIcon> = {
  Bell,
  DollarSign,
  MessageSquare,
  Mail,
  Users,
  LayoutDashboard,
};

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to stay on top
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple tools that help you remember who to contact and what to say. No complexity, just results.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = iconMap[feature.icon];
            return (
              <div
                key={feature.title}
                className="group p-8 bg-card rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-premium transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
