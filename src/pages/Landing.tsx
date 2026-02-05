import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { SEO } from '@/components/SEO';

export default function Landing() {
  return (
    <>
      <SEO
        description="PayPing helps freelancers and small businesses stay on top of client follow-ups and payments with simple reminders."
      />
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-16">
          <Hero />
          <Features />
          <Pricing />
          <FAQ />
        </main>
        <Footer />
      </div>
    </>
  );
}
