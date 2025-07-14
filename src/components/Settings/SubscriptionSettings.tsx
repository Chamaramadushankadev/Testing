import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Package, Shield, Zap, Users, Calendar, DollarSign } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe (in a real app, you'd use your actual publishable key)
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  modules: string[];
}

export const SubscriptionSettings: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [customPlan, setCustomPlan] = useState({
    modules: {
      goals: true,
      tasks: true,
      notes: true,
      proposals: false,
      reminders: true,
      pomodoro: true,
      scripts: false,
      email: false,
      'cold-email': false,
      analytics: false
    },
    teamMembers: 1,
    price: 19
  });

  // Pricing plans
  const plans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: billingCycle === 'month' ? 9.99 : 99.99,
      interval: billingCycle,
      features: [
        'Core productivity features',
        'Up to 3 team members',
        'Basic analytics',
        'Email support'
      ],
      modules: ['goals', 'tasks', 'notes', 'reminders', 'pomodoro']
    },
    {
      id: 'pro',
      name: 'Professional',
      price: billingCycle === 'month' ? 19.99 : 199.99,
      interval: billingCycle,
      features: [
        'All Basic features',
        'Up to 10 team members',
        'Advanced analytics',
        'YouTube script generation',
        'Priority support'
      ],
      popular: true,
      modules: ['goals', 'tasks', 'notes', 'reminders', 'pomodoro', 'scripts', 'analytics', 'proposals']
    },
    {
      id: 'business',
      name: 'Business',
      price: billingCycle === 'month' ? 49.99 : 499.99,
      interval: billingCycle,
      features: [
        'All Professional features',
        'Unlimited team members',
        'Cold email marketing',
        'Email warmup system',
        'Dedicated support'
      ],
      modules: ['goals', 'tasks', 'notes', 'reminders', 'pomodoro', 'scripts', 'analytics', 'proposals', 'email', 'cold-email']
    }
  ];

  // Calculate custom plan price
  useEffect(() => {
    let basePrice = 9.99;
    const moduleCount = Object.values(customPlan.modules).filter(Boolean).length;
    const modulePrice = moduleCount * 2;
    const teamPrice = customPlan.teamMembers > 3 ? (customPlan.teamMembers - 3) * 5 : 0;
    
    let totalPrice = basePrice + modulePrice + teamPrice;
    
    // Apply discount for yearly billing
    if (billingCycle === 'year') {
      totalPrice = totalPrice * 10; // 2 months free
    }
    
    setCustomPlan(prev => ({ ...prev, price: Math.round(totalPrice * 100) / 100 }));
  }, [customPlan.modules, customPlan.teamMembers, billingCycle]);

  const handleCheckout = async (planId: string) => {
    setLoading(true);
    
    try {
      // In a real app, you'd call your backend to create a Stripe checkout session
      // const response = await api.post('/api/create-checkout-session', { planId, billingCycle });
      // const { sessionId } = response.data;
      
      // For demo purposes, we'll just simulate a successful checkout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to Stripe checkout would happen here in a real app
      // const stripe = await stripePromise;
      // await stripe.redirectToCheckout({ sessionId });
      
      alert(`Checkout initiated for ${planId} plan with ${billingCycle}ly billing`);
      setCurrentPlan(planId);
    } catch (error) {
      console.error('Error during checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (module: string) => {
    setCustomPlan(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: !prev.modules[module as keyof typeof prev.modules]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription Management</h3>
        
        {currentPlan ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Current Plan: {plans.find(p => p.id === currentPlan)?.name || 'Custom'}</h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Your subscription renews on January 15, 2026
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Manage Payment Methods
                </button>
                <button className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  Cancel Subscription
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Subscription Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Billing Cycle</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1 capitalize">{billingCycle}ly</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Next Payment</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                    ${plans.find(p => p.id === currentPlan)?.price.toFixed(2) || customPlan.price.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">Payment Method</div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    Visa ending in 4242
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Billing History</h5>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Jan 15, 2025</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">ProductivePro Subscription</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        ${plans.find(p => p.id === currentPlan)?.price.toFixed(2) || customPlan.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                          Paid
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
                        <a href="#" className="hover:underline">Download</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Subscription</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Choose a plan below to get started with ProductivePro</p>
            </div>
          </div>
        )}
        
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingCycle('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'year'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Yearly <span className="text-green-600 dark:text-green-400 ml-1">Save 17%</span>
            </button>
          </div>
        </div>
        
        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 ${
                plan.popular 
                  ? 'border-blue-500 dark:border-blue-600' 
                  : 'border-gray-200 dark:border-gray-700'
              } p-6 relative`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
              )}
              
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h4>
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price.toFixed(2)}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">/{plan.interval}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading || currentPlan === plan.id}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  currentPlan === plan.id
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 cursor-default'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : currentPlan === plan.id ? 'Current Plan' : 'Choose Plan'}
              </button>
            </div>
          ))}
        </div>
        
        {/* Custom Plan Builder */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Build Your Custom Plan
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Select Modules</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'goals', label: 'Goals & Objectives', icon: Package },
                      { id: 'tasks', label: 'Task Management', icon: Check },
                      { id: 'notes', label: 'Notes & Knowledge Base', icon: Package },
                      { id: 'proposals', label: 'Proposals & Projects', icon: Package },
                      { id: 'reminders', label: 'Reminders', icon: Package },
                      { id: 'pomodoro', label: 'Pomodoro Timer', icon: Package },
                      { id: 'scripts', label: 'YouTube Scripts', icon: Package },
                      { id: 'email', label: 'Email Management', icon: Package },
                      { id: 'cold-email', label: 'Cold Email Marketing', icon: Package },
                      { id: 'analytics', label: 'Advanced Analytics', icon: Package }
                    ].map((module) => (
                      <label 
                        key={module.id} 
                        className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          customPlan.modules[module.id as keyof typeof customPlan.modules]
                            ? 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={customPlan.modules[module.id as keyof typeof customPlan.modules] || false}
                          onChange={() => handleModuleToggle(module.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          customPlan.modules[module.id as keyof typeof customPlan.modules]
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          {customPlan.modules[module.id as keyof typeof customPlan.modules] && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-gray-900 dark:text-white">{module.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Team Size</h4>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={customPlan.teamMembers}
                      onChange={(e) => setCustomPlan(prev => ({ ...prev, teamMembers: parseInt(e.target.value) }))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-16 text-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{customPlan.teamMembers}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm"> users</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Your Custom Plan</h4>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Selected Modules:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Object.values(customPlan.modules).filter(Boolean).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Team Members:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{customPlan.teamMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Billing Cycle:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{billingCycle}ly</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                    <div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">${customPlan.price.toFixed(2)}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">/{billingCycle}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCheckout('custom')}
                    disabled={loading || Object.values(customPlan.modules).filter(Boolean).length === 0}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Get Custom Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};