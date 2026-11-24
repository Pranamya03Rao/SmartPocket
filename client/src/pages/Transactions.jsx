import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ReceiptUpload } from '../components/upload/ReceiptUpload.jsx';
import {
  Plus,
  UploadCloud,
  Download,
  Search,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

const CATEGORIES = [
  'groceries', 'rent', 'health', 'transport', 'education',
  'utilities', 'shopping', 'entertainment', 'food', 'other',
];

const PAYMENT_MODES = ['cash', 'upi', 'card', 'netbanking', 'wallet', 'other'];

export function Transactions() {
  const { t, isKn } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    amount: '',
    type: 'expense',
    category: 'groceries',
    paymentMode: 'cash',
    notes: '',
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (type) params.type = type;

      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (_err) {
      console.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, category, type]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingTx(null);
    setForm({
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      amount: '',
      type: 'expense',
      category: 'groceries',
      paymentMode: 'cash',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = tx => {
    setEditingTx(tx);
    setForm({
      date: new Date(tx.date).toISOString().split('T')[0],
      merchant: tx.merchant || tx.title || '',
      amount: tx.amount,
      type: tx.type,
      category: tx.category || 'groceries',
      paymentMode: tx.paymentMode || 'cash',
      notes: tx.notes || '',
    });
    setShowModal(true);
  };

  const handleSaveModal = async e => {
    e.preventDefault();
    try {
      if (editingTx) {
        await api.patch(`/transactions/${editingTx._id}`, {
          ...form,
          amount: Number(form.amount),
        });
      } else {
        await api.post('/transactions', {
          ...form,
          amount: Number(form.amount),
        });
      }
      setShowModal(false);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.error || (isKn ? 'ದಾಖಲಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to save transaction'));
    }
  };

  const handleDelete = async id => {
    if (confirm(t('transactions.confirmDelete'))) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (err) {
        alert(err.response?.data?.error || (isKn ? 'ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to delete transaction'));
      }
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/transactions/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'smart-pocket-ledger.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (_err) {
      alert(isKn ? 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('transactions.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('transactions.subtitle')} ({t('transactions.totalEntries')} {totalCount})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowUpload(prev => !prev)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors min-h-[44px] ${
              showUpload
                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            {showUpload ? (isKn ? 'ಸ್ಕ್ಯಾನರ್ ಮುಚ್ಚಿ' : 'Close Scanner') : t('transactions.scanBill')}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[44px]"
            title={t('transactions.exportCsv')}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{isKn ? 'ಲೆಕ್ಕ ಡೌನ್‌ಲೋಡ್' : 'Export'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            {t('transactions.addTransaction')}
          </button>
        </div>
      </div>

      {/* AI Receipt & Statement Upload Component (Toggled) */}
      {showUpload && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <ReceiptUpload
            onConfirmSuccess={() => {
              fetchTransactions();
            }}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('transactions.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="w-full sm:w-44 rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white capitalize min-h-[44px]"
          >
            <option value="">{isKn ? 'ಎಲ್ಲಾ ವಿಭಾಗಗಳು' : 'All Categories'}</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{t(`categories.${c}`) || c}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={e => { setType(e.target.value); setPage(1); }}
            className="w-full sm:w-36 rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
          >
            <option value="">{isKn ? 'ಎಲ್ಲಾ ವಿಧ' : 'All Types'}</option>
            <option value="expense">{isKn ? 'ಖರ್ಚು (Expense)' : 'Expense'}</option>
            <option value="income">{isKn ? 'ಆದಾಯ (Income)' : 'Income'}</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">{isKn ? 'ದಿನಾಂಕ' : 'Date'}</th>
                <th className="px-4 py-3">{t('transactions.paidTo')}</th>
                <th className="px-4 py-3">{isKn ? 'ವಿಭಾಗ' : 'Category'}</th>
                <th className="px-4 py-3">{isKn ? 'ಪಾವತಿ ವಿಧಾನ' : 'Payment'}</th>
                <th className="px-4 py-3">{isKn ? 'ವಿವರ' : 'Notes'}</th>
                <th className="px-4 py-3 text-right">{isKn ? 'ಮೊತ್ತ' : 'Amount'}</th>
                <th className="px-4 py-3 text-right">{isKn ? 'ಕ್ರಿಯೆಗಳು' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
                    {t('common.loading')}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    {t('dashboard.noTransactions')}
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {new Date(tx.date).toLocaleDateString(isKn ? 'kn-IN' : 'en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {tx.merchant || tx.title}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 capitalize dark:bg-indigo-950/50 dark:text-indigo-300">
                        {t(`categories.${tx.category}`) || tx.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs uppercase text-slate-500 dark:text-slate-400">
                      {tx.paymentMode}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {tx.notes || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} ₹{tx.amount?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title={t('common.edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx._id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              {isKn ? `ಪುಟ ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800 min-h-[36px]"
              >
                {isKn ? 'ಹಿಂದಿನದು' : 'Previous'}
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800 min-h-[36px]"
              >
                {isKn ? 'ಮುಂದಿನದು' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTx ? (isKn ? 'ದಾಖಲೆಯನ್ನು ತಿದ್ದಿ' : 'Edit Transaction') : t('transactions.addTransaction')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors min-h-[40px] ${
                    form.type === 'expense'
                      ? 'bg-white shadow-sm text-red-600 dark:bg-slate-700 dark:text-red-400'
                      : 'text-slate-500'
                  }`}
                >
                  {isKn ? 'ಖರ್ಚು (Expense)' : 'Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'income' }))}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors min-h-[40px] ${
                    form.type === 'income'
                      ? 'bg-white shadow-sm text-emerald-600 dark:bg-slate-700 dark:text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  {isKn ? 'ಆದಾಯ (Income)' : 'Income'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  {isKn ? 'ಮೊತ್ತ (₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="250.00"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  {t('transactions.paidTo')}
                </label>
                <input
                  type="text"
                  required
                  value={form.merchant}
                  onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))}
                  placeholder={t('transactions.paidToPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    {isKn ? 'ವಿಭಾಗ' : 'Category'}
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white capitalize min-h-[44px]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{t(`categories.${c}`) || c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    {isKn ? 'ಪಾವತಿ ಮಾಧ್ಯಮ' : 'Payment Mode'}
                  </label>
                  <select
                    value={form.paymentMode}
                    onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white capitalize min-h-[44px]"
                  >
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  {isKn ? 'ದಿನಾಂಕ' : 'Date'}
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  {isKn ? 'ಹೆಚ್ಚುವರಿ ವಿವರಣೆ' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={isKn ? 'ಉದಾ: ಸಿಮೆಂಟ್ ಚೀಲ, ದಿನದ ಹಾಲು, ಇತ್ಯಾದಿ' : 'Optional notes'}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white min-h-[44px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 min-h-[44px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 shadow-sm min-h-[44px]"
                >
                  {editingTx ? (isKn ? 'ಬದಲಾಯಿಸಿ' : 'Update') : (isKn ? 'ದಾಖಲಿಸಿ' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
