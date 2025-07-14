import React, { useState } from 'react';
import { MessageSquare, Send, HelpCircle, FileText, Book, ExternalLink } from 'lucide-react';

export const HelpCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contact' | 'faq' | 'docs'>('contact');
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // In a real app, you would send this to your backend
      // await api.post('/api/support/tickets', ticketForm);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      setTicketForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      question: 'How do I get started with ProductivePro?',
      answer: 'To get started, first set up your goals in the Goals section. Then create tasks related to those goals. You can also set up reminders to keep you on track.'
    },
    {
      question: 'Can I use ProductivePro on mobile devices?',
      answer: 'Yes, ProductivePro is fully responsive and works on all devices including smartphones and tablets.'
    },
    {
      question: 'How does the email warmup system work?',
      answer: 'The email warmup system gradually increases your sending volume to improve deliverability. It automatically exchanges emails between your accounts and tracks metrics like open rates and inbox placement.'
    },
    {
      question: 'How do I add team members?',
      answer: 'Go to Settings > Team Management, then click "Add Team Member". You can set specific permissions for each team member.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use industry-standard encryption and security practices to protect your data. Your information is never shared with third parties without your consent.'
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from the Settings > Billing section. Your data will remain accessible until the end of your current billing period.'
    }
  ];

  const ContactForm = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Contact Support</h3>
      
      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ticket Submitted Successfully</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Thank you for contacting us. We'll get back to you as soon as possible.</p>
          <button 
            onClick={() => setSubmitted(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another Ticket
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                value={ticketForm.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={ticketForm.email}
                onChange={handleInputChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
              <input
                type="text"
                name="subject"
                value={ticketForm.subject}
                onChange={handleInputChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select
                name="priority"
                value={ticketForm.priority}
                onChange={handleInputChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
            <textarea
              name="message"
              value={ticketForm.message}
              onChange={handleInputChange}
              rows={6}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const FAQ = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h3>
      
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-start">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <span>{faq.question}</span>
            </h4>
            <p className="text-gray-600 dark:text-gray-400 ml-7">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const Documentation = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Documentation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Getting Started Guide', icon: Book, description: 'Learn the basics of ProductivePro' },
          { title: 'Email Warmup Guide', icon: Send, description: 'How to properly warm up your email accounts' },
          { title: 'Task Management', icon: FileText, description: 'Best practices for managing tasks and goals' },
          { title: 'Team Collaboration', icon: MessageSquare, description: 'Working with team members effectively' }
        ].map((doc, index) => {
          const Icon = doc.icon;
          return (
            <a 
              key={index}
              href="#" 
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-start space-x-3"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                  {doc.title}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doc.description}</p>
              </div>
            </a>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Video Tutorials</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Getting Started with ProductivePro',
            'Setting Up Email Warmup',
            'Managing Tasks and Goals',
            'Team Collaboration Features'
          ].map((title, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Video Preview</span>
              </div>
              <h5 className="font-medium text-gray-900 dark:text-white">{title}</h5>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <HelpCircle className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Help & Support
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Get help with ProductivePro or contact our support team</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'contact', label: 'Contact Support', icon: MessageSquare },
            { id: 'faq', label: 'FAQ', icon: HelpCircle },
            { id: 'docs', label: 'Documentation', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'contact' && <ContactForm />}
      {activeTab === 'faq' && <FAQ />}
      {activeTab === 'docs' && <Documentation />}
    </div>
  );
};