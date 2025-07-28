import React, { useState } from 'react';
import { Check, Star, Zap, Users, Mail, Palette, BarChart3, Crown, ArrowRight, Sparkles, X } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  const packages = [
    {
      id: 'free',
      name: 'Free',
      description: 'For individuals just starting out',
      price: { monthly: 0, yearly: 0 },
      color: 'from-green-500 to-green-600',
      icon: Star,
      features: [
        '5 Goals',
        '10 Tasks',
        '5 Notes',
        '5 Proposals',
        '5 Reminders',
        'Pomodoro Timer',
        '5 YouTube Scripts',
        '1 Team Member',
        'Community Support'
      ],
      limits: {
        goals: 5,
        tasks: 10,
        notes: 5,
        proposals: 5,
        reminders: 5,
        scripts: 5,
        teamMembers: 1
      }
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'For solo professionals',
      price: { monthly: 9.99, yearly: 99 },
      color: 'from-yellow-500 to-orange-500',
      icon: Zap,
      popular: false,
      features: [
        'Unlimited Goals',
        'Unlimited Tasks',
        'Unlimited Notes',
        'Unlimited Proposals',
        'Unlimited Reminders',
        'Pomodoro Timer',
        'time tracker',
        'Unlimited YouTube Scripts',
        '2 Team Members',
        'Email Support',
        'Chat with Team Members & Channels'
      ],
      limits: {
        goals: -1,
        tasks: -1,
        notes: -1,
        proposals: -1,
        reminders: -1,
        scripts: -1,
        teamMembers: 2
      }
    },
    {
      id: 'creator',
      name: 'Creator',
      description: 'For creators and small teams',
      price: { monthly: 24.99, yearly: 249 },
      color: 'from-blue-500 to-blue-600',
      icon: Palette,
      popular: true,
      features: [
        'Everything in Starter',
        '5 Team Members',
        '2 Email Accounts (Campaigns + Warmup)',
        'Script Generator (Advanced AI)',
        'Inspiration Board (save images & videos)',
        'Social Template Creation (basic Canva-like editor)',
        'Finance Management Tools',
        'Moodboard',
        'Priority Support'
      ],
      limits: {
        goals: -1,
        tasks: -1,
        notes: -1,
        proposals: -1,
        reminders: -1,
        scripts: -1,
        teamMembers: 5,
        emailAccounts: 2,
        aiScriptGeneration: true,
        financeTools: true,
        socialTemplates: true
      }
    },
    {
      id: 'business',
      name: 'Business',
      description: 'For growing marketing teams',
      price: { monthly: 49.99, yearly: 499 },
      color: 'from-red-500 to-red-600',
      icon: Users,
      features: [
        'Everything in Creator',
        'Unlimited Team Members',
        'Email Campaigns (10 Email Accounts)',
        'Unlimited Email Warmups',
        'Advanced Social Templates',
        'Analytics Dashboard',
        'Dedicated Support'
      ],
      limits: {
        goals: -1,
        tasks: -1,
        notes: -1,
        proposals: -1,
        reminders: -1,
        scripts: -1,
        teamMembers: -1,
        aiScriptGeneration: true,
        financeTools: true,
        socialTemplates: true,
        emailAccounts: 10,
        emailWarmup: true,
        analytics: true
      }
    }
  ];

  const businessProAddon = {
    id: 'business-pro-addon',
    name: 'Business Pro Add-on',
    description: 'For high-volume outreach',
    price: { monthly: 3, yearly: 30 },
    color: 'from-purple-500 to-purple-600',
    icon: Crown,
    features: [
      'Adds extra email account to your Business plan',
      'Includes warmup + campaigns',
      'Ideal for agencies managing many clients or inboxes'
    ]
  };

  const handleUpgrade = (packageId: string) => {
    console.log(`Upgrading to ${packageId} with ${billingCycle} billing`);
    alert(`Upgrade to ${packageId} initiated! This would redirect to payment processing.`);
    onClose();
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const getSavings = (monthly: number, yearly: number) => {
    if (monthly === 0) return 0;
    const monthlyCost = monthly * 12;
    const savings = ((monthlyCost - yearly) / monthlyCost) * 100;
    return Math.round(savings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Supercharge Your
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Productivity</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Choose the perfect plan to unlock powerful features
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Yearly
                <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-bold">
                  Save up to 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              const price = billingCycle === 'monthly' ? pkg.price.monthly : pkg.price.yearly;
              const savings = getSavings(pkg.price.monthly, pkg.price.yearly);
              
              return (
                <div
                  key={pkg.id}
                  className={`relative bg-white dark:bg-gray-700 rounded-2xl shadow-xl border-2 ${
                    pkg.popular 
                      ? 'border-blue-500 dark:border-blue-600 scale-105' 
                      : 'border-gray-200 dark:border-gray-600'
                  } p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-1">
                        <Sparkles className="w-4 h-4" />
                        <span>MOST POPULAR</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${pkg.color} rounded-2xl mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{pkg.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{pkg.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(price)}
                        </span>
                        {price > 0 && (
                          <span className="text-gray-600 dark:text-gray-400 ml-2">
                            / {billingCycle === 'monthly' ? 'month' : 'year'}
                          </span>
                        )}
                      </div>
                      {billingCycle === 'yearly' && savings > 0 && (
                        <div className="text-green-600 dark:text-green-400 text-sm font-medium mt-1">
                          Save {savings}% with yearly billing
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handleUpgrade(pkg.id)}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                      pkg.id === 'free'
                        ? 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
                        : `bg-gradient-to-r ${pkg.color} text-white hover:shadow-lg hover:scale-105`
                    }`}
                  >
                    {pkg.id === 'free' ? 'Current Plan' : 'Upgrade Now'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Business Pro Add-on */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="lg:w-2/3 mb-6 lg:mb-0">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${businessProAddon.color} rounded-xl`}>
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{businessProAddon.name}</h3>
                    <p className="text-purple-600 dark:text-purple-400 font-medium">{businessProAddon.description}</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {businessProAddon.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="lg:w-1/3 text-center lg:text-right">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    +${billingCycle === 'monthly' ? businessProAddon.price.monthly : businessProAddon.price.yearly}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    / {billingCycle === 'monthly' ? 'month' : 'year'} per extra email account
                  </div>
                </div>
                
                <button
                  onClick={() => handleUpgrade(businessProAddon.id)}
                  className={`px-8 py-3 bg-gradient-to-r ${businessProAddon.color} text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300`}
                >
                  Add to Business Plan
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  question: "Can I change my plan anytime?",
                  answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
                },
                {
                  question: "What happens to my data if I downgrade?",
                  answer: "Your data is never deleted. If you exceed limits after downgrading, you'll have read-only access until you upgrade again."
                },
                {
                  question: "Do you offer refunds?",
                  answer: "We offer a 30-day money-back guarantee for all paid plans. No questions asked."
                },
                {
                  question: "Can I add more team members later?",
                  answer: "Absolutely! You can add team members up to your plan's limit, or upgrade to a higher plan for more members."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to supercharge your productivity?
              </h2>
              <p className="text-blue-100 text-lg mb-6">
                Join thousands of professionals who have transformed their workflow with Nexa Pro
              </p>
              <button
                onClick={() => handleUpgrade('creator')}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Start Your Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};