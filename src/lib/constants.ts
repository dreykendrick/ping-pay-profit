// PayPing Constants

export const PLANS = {
  US: {
    id: 'US',
    name: 'US Plan',
    price: 29,
    currency: 'USD',
    description: 'Best for freelancers & service businesses in the US',
    paymentMethods: [
      { name: 'PayPal', instruction: 'Send to: payments@payping.app' },
      { name: 'Zelle', instruction: 'Send to: payments@payping.app' },
      { name: 'CashApp', instruction: 'Send to: $PayPingApp' },
      { name: 'Venmo', instruction: 'Send to: @PayPingApp' },
    ],
  },
  EA: {
    id: 'EA',
    name: 'East Africa Plan',
    price: 10,
    currency: 'USD',
    description: 'Built for WhatsApp-first businesses',
    paymentMethods: [
      { name: 'M-Pesa', instruction: 'Paybill: 123456, Account: PayPing' },
      { name: 'Airtel Money', instruction: 'Send to: 0700123456' },
      { name: 'Tigo Pesa', instruction: 'Send to: 0700123456' },
    ],
  },
} as const;

export const FAQ_ITEMS = [
  {
    question: 'Do you offer a free trial?',
    answer: 'No. We onboard paid users only. If it doesn\'t help you within 7 days, we refund — no questions asked.',
  },
  {
    question: 'Does it send WhatsApp automatically?',
    answer: 'Not yet. Copy & send is instant and reliable. One tap copies your message, then paste it right into WhatsApp.',
  },
  {
    question: 'How fast is activation?',
    answer: 'Usually same day. Once we confirm your payment, your account is activated within hours.',
  },
  {
    question: 'What\'s your refund policy?',
    answer: '7-day money-back guarantee. If PayPing doesn\'t help you stay organized and follow up better, we refund your payment in full.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes! Contact us anytime to switch between US and EA plans. We\'ll prorate the difference.',
  },
];

export const FEATURES = [
  {
    title: 'Never Miss a Follow-up',
    description: 'Set reminders for any client, any date. We\'ll show you exactly who to contact today.',
    icon: 'Bell',
  },
  {
    title: 'Payment Reminders',
    description: 'Track who owes you money. Send professional payment requests with one tap.',
    icon: 'DollarSign',
  },
  {
    title: 'WhatsApp Ready',
    description: 'Copy and paste pre-written messages directly to WhatsApp. No typing, no forgetting.',
    icon: 'MessageSquare',
  },
  {
    title: 'Email Templates',
    description: 'Professional email templates ready to send. Customize once, use forever.',
    icon: 'Mail',
  },
  {
    title: 'Client Database',
    description: 'Keep all your client info in one place. Notes, contact history, payment status.',
    icon: 'Users',
  },
  {
    title: 'Daily Dashboard',
    description: 'See everything due today at a glance. Overdue? We\'ll highlight it.',
    icon: 'LayoutDashboard',
  },
];
