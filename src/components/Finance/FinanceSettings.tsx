import React, { useState, useEffect } from 'react';
import { Settings, Save, Palette, Building, CreditCard, Bell, Globe, DollarSign } from 'lucide-react';
import { financeAPI } from '../../services/api';
import { FinanceSettings as FinanceSettingsType } from '../../types/finance';

export const FinanceSettings: React.FC = () => {
  const [settings, setSettings] = useState<FinanceSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await financeAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Set default settings if none exist
      setSettings({
        id: 'default',
        defaultCurrency: 'USD',
        taxSettings: [],
        invoiceBranding: {
          companyName: 'Your Company',
          primaryColor: '#3B82F6',
          companyAddress: '',
          companyEmail: '',
          companyPhone: '',
          footer: ''
        },
        paymentMethods: {
          stripe: { enabled: false, publicKey: '' },
          paypal: { enabled: false, clientId: '' },
          wise: { enabled: false, apiKey: '' }
        },
        notifications: {
          invoiceReminders: true,
          taxDeadlines: true,
          budgetAlerts: true,
          paymentReceived: true
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (formData: FormData) => {
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...settings,
        defaultCurrency: formData.get('defaultCurrency') as string,
        invoiceBranding: {
          companyName: formData.get('companyName') as string,
          primaryColor: formData.get('primaryColor') as string,
          companyAddress: formData.get('companyAddress') as string,
          companyEmail: formData.get('companyEmail') as string,
          companyPhone: formData.get('companyPhone') as string,
          footer: formData.get('footer') as string
        },
        paymentMethods: {
          stripe: {
            enabled: formData.get('stripeEnabled') === 'true',
            publicKey: formData.get('stripePublicKey') as string
          },
          paypal: {
            enabled: formData.get('paypalEnabled') === 'true',
            clientId: formData.get('paypalClientId') as string
          },
          wise: {
            enabled: formData.get('wiseEnabled') === 'true',
            apiKey: formData.get('wiseApiKey') as string
          }
        },
        notifications: {
          invoiceReminders: formData.get('invoiceReminders') === 'true',
          taxDeadlines: formData.get('taxDeadlines') === 'true',
          budgetAlerts: formData.get('budgetAlerts') === 'true',
          paymentReceived: formData.get('paymentReceived') === 'true'
        }
      };

      const response = await financeAPI.updateSettings(updatedSettings);
      setSettings(response.data);
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addTaxSetting = () => {
    if (!settings) return;
    
    const newTaxSetting = {
      region: '',
      taxType: 'income' as const,
      rate: 0,
      quarterlyDates: [],
      annualDeadline: new Date(),
      isActive: true
    };

    setSettings({
      ...settings,
      taxSettings: [...settings.taxSettings, newTaxSetting]
    });
  };

  const removeTaxSetting = (index: number) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      taxSettings: settings.taxSettings.filter((_, i) => i !== index)
    });
  };

  const updateTaxSetting = (index: number, field: string, value: any) => {
    if (!settings) return;
    
    const updatedTaxSettings = [...settings.taxSettings];
    updatedTaxSettings[index] = {
      ...updatedTaxSettings[index],
      [field]: value
    };

    setSettings({
      ...settings,
      taxSettings: updatedTaxSettings
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Settings Not Available</h3>
        <p className="text-gray-600 dark:text-gray-400">Unable to load finance settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Settings className="w-5 h-5 mr-2 text-green-600" />
          Finance Settings
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure your finance management preferences</p>
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSaveSettings(formData);
        }}
        className="space-y-8"
      >
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-blue-600" />
            General Settings
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Currency</label>
              <select
                name="defaultCurrency"
                defaultValue={settings.defaultCurrency}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Branding */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2 text-purple-600" />
            Invoice Branding
          </h4>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  defaultValue={settings.invoiceBranding.companyName}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your Company Name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Color</label>
                <input
                  type="color"
                  name="primaryColor"
                  defaultValue={settings.invoiceBranding.primaryColor}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent h-12"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Email</label>
                <input
                  type="email"
                  name="companyEmail"
                  defaultValue={settings.invoiceBranding.companyEmail}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="company@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Phone</label>
                <input
                  type="tel"
                  name="companyPhone"
                  defaultValue={settings.invoiceBranding.companyPhone}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Address</label>
              <textarea
                name="companyAddress"
                rows={3}
                defaultValue={settings.invoiceBranding.companyAddress}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="123 Business St, City, State 12345"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Footer</label>
              <textarea
                name="footer"
                rows={2}
                defaultValue={settings.invoiceBranding.footer}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Thank you for your business!"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-600" />
            Payment Methods
          </h4>
          
          <div className="space-y-6">
            {/* Stripe */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">Stripe</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accept credit card payments</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="stripeEnabled"
                    value="true"
                    defaultChecked={settings.paymentMethods.stripe?.enabled}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Publishable Key</label>
                <input
                  type="text"
                  name="stripePublicKey"
                  defaultValue={settings.paymentMethods.stripe?.publicKey}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="pk_test_..."
                />
              </div>
            </div>

            {/* PayPal */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">PayPal</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accept PayPal payments</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="paypalEnabled"
                    value="true"
                    defaultChecked={settings.paymentMethods.paypal?.enabled}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client ID</label>
                <input
                  type="text"
                  name="paypalClientId"
                  defaultValue={settings.paymentMethods.paypal?.clientId}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="PayPal Client ID"
                />
              </div>
            </div>

            {/* Wise */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">Wise (TransferWise)</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">International bank transfers</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="wiseEnabled"
                    value="true"
                    defaultChecked={settings.paymentMethods.wise?.enabled}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                <input
                  type="password"
                  name="wiseApiKey"
                  defaultValue={settings.paymentMethods.wise?.apiKey}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Wise API Key"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-yellow-600" />
              Tax Settings
            </h4>
            <button
              type="button"
              onClick={addTaxSetting}
              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Add Tax Setting
            </button>
          </div>
          
          <div className="space-y-4">
            {settings.taxSettings.map((taxSetting, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Region</label>
                    <input
                      type="text"
                      value={taxSetting.region}
                      onChange={(e) => updateTaxSetting(index, 'region', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., US, UK, CA"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Type</label>
                    <select
                      value={taxSetting.taxType}
                      onChange={(e) => updateTaxSetting(index, 'taxType', e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="income">Income Tax</option>
                      <option value="self-employment">Self-Employment Tax</option>
                      <option value="vat">VAT</option>
                      <option value="gst">GST</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rate (%)</label>
                    <input
                      type="number"
                      value={taxSetting.rate}
                      onChange={(e) => updateTaxSetting(index, 'rate', parseFloat(e.target.value))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeTaxSetting(index)}
                      className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {settings.taxSettings.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tax settings configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-orange-600" />
            Notification Settings
          </h4>
          
          <div className="space-y-4">
            {[
              { key: 'invoiceReminders', label: 'Invoice Reminders', description: 'Get notified about overdue invoices' },
              { key: 'taxDeadlines', label: 'Tax Deadlines', description: 'Reminders for tax payment deadlines' },
              { key: 'budgetAlerts', label: 'Budget Alerts', description: 'Notifications when approaching budget limits' },
              { key: 'paymentReceived', label: 'Payment Received', description: 'Notifications when payments are received' }
            ].map((notification) => (
              <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">{notification.label}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notification.description}</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name={notification.key}
                    value="true"
                    defaultChecked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};