import React, { useState, useEffect } from 'react';
import { Plus, FileText, Send, Eye, DollarSign, Calendar, AlertCircle, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import { financeAPI } from '../../services/financeAPI';
import { Invoice, FinanceClient, FinanceProject } from '../../types/finance';

export const InvoiceManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<FinanceClient[]>([]);
  const [projects, setProjects] = useState<FinanceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, clientsRes, projectsRes] = await Promise.all([
        financeAPI.getInvoices(),
        financeAPI.getClients(),
        financeAPI.getProjects()
      ]);
      
      setInvoices(invoicesRes.data.invoices || []);
      setClients(clientsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setInvoices([]);
      setClients([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateInvoice = async (formData: FormData) => {
    try {
      // Parse items from form
      const items = [];
      let itemIndex = 0;
      while (formData.get(`item_${itemIndex}_description`)) {
        const description = formData.get(`item_${itemIndex}_description`) as string;
        const quantity = parseFloat(formData.get(`item_${itemIndex}_quantity`) as string);
        const rate = parseFloat(formData.get(`item_${itemIndex}_rate`) as string);
        
        items.push({
          id: `item_${itemIndex}`,
          description,
          quantity,
          rate,
          amount: quantity * rate
        });
        itemIndex++;
      }

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxRate = parseFloat(formData.get('taxRate') as string) || 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      const invoiceData = {
        clientId: formData.get('clientId') as string,
        projectId: formData.get('projectId') as string || undefined,
        amount: subtotal,
        currency: formData.get('currency') as string || 'USD',
        issueDate: new Date(formData.get('issueDate') as string),
        dueDate: new Date(formData.get('dueDate') as string),
        items,
        taxRate,
        taxAmount,
        totalAmount,
        notes: formData.get('notes') as string || '',
        paymentTerms: formData.get('paymentTerms') as string || 'Net 30',
        isRecurring: formData.get('isRecurring') === 'true'
      };

      if (editingInvoice) {
        const response = await financeAPI.updateInvoice(editingInvoice.id, invoiceData);
        setInvoices(invoices.map(i => i.id === editingInvoice.id ? response.data : i));
      } else {
        const response = await financeAPI.createInvoice(invoiceData);
        setInvoices([response.data, ...invoices]);
      }

      setEditingInvoice(null);
      setShowAddInvoice(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await financeAPI.deleteInvoice(invoiceId);
      setInvoices(invoices.filter(i => i.id !== invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const response = await financeAPI.markInvoicePaid(invoiceId);
      setInvoices(invoices.map(i => i.id === invoiceId ? response.data : i));
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    return filterStatus === 'all' || invoice.status === filterStatus;
  });

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'viewed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'overdue': return AlertCircle;
      case 'viewed': return Eye;
      case 'sent': return Send;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            setEditingInvoice(null);
            setShowAddInvoice(true);
          }}
          className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvoices.map((invoice) => {
          const StatusIcon = getStatusIcon(invoice.status);
          const client = clients.find(c => c.id === invoice.clientId);
          const isOverdue = invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date();
          
          return (
            <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{client?.name || 'Unknown Client'}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingInvoice(invoice);
                      setShowAddInvoice(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="w-4 h-4" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isOverdue ? 'overdue' : invoice.status)}`}>
                      {isOverdue ? 'Overdue' : invoice.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Due Date:</span>
                  <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {invoice.status === 'paid' ? (
                  <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Paid on {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMarkPaid(invoice.id)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Invoices Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first invoice to start tracking payments.</p>
          <button
            onClick={() => setShowAddInvoice(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Your First Invoice
          </button>
        </div>
      )}

      {/* Add/Edit Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddOrUpdateInvoice(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client</label>
                  <select
                    name="clientId"
                    defaultValue={editingInvoice?.clientId || ''}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project (Optional)</label>
                  <select
                    name="projectId"
                    defaultValue={editingInvoice?.projectId || ''}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Issue Date</label>
                  <input
                    type="date"
                    name="issueDate"
                    defaultValue={editingInvoice ? new Date(editingInvoice.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={editingInvoice ? new Date(editingInvoice.dueDate).toISOString().slice(0, 10) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <select
                    name="currency"
                    defaultValue={editingInvoice?.currency || 'USD'}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Invoice Items</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Rate</div>
                    <div className="col-span-3">Amount</div>
                  </div>
                  
                  {/* Default item */}
                  <div className="grid grid-cols-12 gap-3">
                    <input
                      type="text"
                      name="item_0_description"
                      defaultValue={editingInvoice?.items[0]?.description || ''}
                      placeholder="Service description"
                      className="col-span-5 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="number"
                      name="item_0_quantity"
                      defaultValue={editingInvoice?.items[0]?.quantity || 1}
                      min="0"
                      step="0.01"
                      className="col-span-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="number"
                      name="item_0_rate"
                      defaultValue={editingInvoice?.items[0]?.rate || ''}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="col-span-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                    <div className="col-span-3 flex items-center text-gray-900 dark:text-white">
                      Auto-calculated
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    name="taxRate"
                    defaultValue={editingInvoice?.taxRate || 0}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    defaultValue={editingInvoice?.paymentTerms || 'Net 30'}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Due on receipt">Due on receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Net 90">Net 90</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingInvoice?.notes || ''}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Additional notes or payment instructions..."
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    value="true"
                    defaultChecked={editingInvoice?.isRecurring || false}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">This is a recurring invoice</span>
                </label>
              </div>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInvoice(false);
                    setEditingInvoice(null);
                  }}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};