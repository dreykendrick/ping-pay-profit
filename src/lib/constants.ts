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
    name: 'International Plan',
    price: 10,
    currency: 'USD',
    description: 'Built for WhatsApp-first businesses worldwide',
    paymentMethods: [
      { name: 'M-Pesa', instruction: 'Paybill: 123456, Account: PayPing' },
      { name: 'Airtel Money', instruction: 'Send to: 0700123456' },
      { name: 'Tigo Pesa', instruction: 'Send to: 0700123456' },
      { name: 'PayPal', instruction: 'Send to: payments@payping.app' },
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
    question: 'How is pricing determined?',
    answer: 'Pricing is set during account setup based on your region. This allows us to offer fair pricing globally.',
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

// Message templates for reminders
export const MESSAGE_TEMPLATES = [
  {
    id: 'followup-general',
    name: 'General Follow-up',
    kind: 'followup',
    channel: 'both',
    template: 'Hi {name}! Just checking in on our conversation. Let me know if you have any questions or if there\'s anything I can help with.',
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    kind: 'payment',
    channel: 'both',
    template: 'Hi {name}! This is a friendly reminder about the pending payment of {amount}. Please let me know if you have any questions.',
  },
  {
    id: 'payment-overdue',
    name: 'Overdue Payment',
    kind: 'payment',
    channel: 'both',
    template: 'Hi {name}! Your payment is now overdue. Please send at your earliest convenience or reach out if you need to discuss payment options.',
  },
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    kind: 'followup',
    channel: 'both',
    template: 'Hi {name}! Just a reminder about our scheduled appointment. Looking forward to connecting with you!',
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    kind: 'followup',
    channel: 'both',
    template: 'Hi {name}! Thank you for your business. It was a pleasure working with you. Please don\'t hesitate to reach out if you need anything.',
  },
  {
    id: 'quote-followup',
    name: 'Quote Follow-up',
    kind: 'followup',
    channel: 'both',
    template: 'Hi {name}! I wanted to follow up on the quote I sent. Do you have any questions or would you like to proceed?',
  },
  {
    id: 'project-update',
    name: 'Project Update',
    kind: 'followup',
    channel: 'both',
    template: 'Hi {name}! Quick update on your project - things are progressing well. Let me know if you\'d like more details.',
  },
  {
    id: 'invoice-sent',
    name: 'Invoice Sent',
    kind: 'payment',
    channel: 'email',
    template: 'Hi {name}! I\'ve sent over the invoice for our recent work. Please let me know if you have any questions about the charges.',
  },
];
