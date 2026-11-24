import React, { useState } from 'react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { UploadCloud, CheckCircle, AlertTriangle, FileText, Trash2, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  'food', 'transport', 'groceries', 'entertainment', 'education',
  'health', 'shopping', 'utilities', 'rent', 'debt', 'other',
];

export function ReceiptUpload({ onConfirmSuccess }) {
  const { t, isKn } = useLanguage();
  const [file, setFile] = useState(null);
  const [sourceType, setSourceType] = useState('receipt');
  const [analyzing, setAnalyzing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Translations for this component
  const tx = {
    title: isKn ? 'AI ರಸೀದಿ / ಬಿಲ್ ಸ್ಕ್ಯಾನರ್' : 'AI Document & Receipt Scanner',
    subtitle: isKn
      ? 'ಅಂಗಡಿ ಬಿಲ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ಹೇಳಿಕೆಯನ್ನು AI ಮೂಲಕ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಓದಿ ನಮೂದಿಸಿ'
      : 'Extract items automatically via Gemini AI or parse bank statements locally from CSV',
    receiptTab: isKn ? 'ರಸೀದಿ (ಫೋಟೋ/PDF)' : 'Receipt (Image/PDF)',
    statementTab: isKn ? 'ಬ್ಯಾಂಕ್ ಹೇಳಿಕೆ (CSV)' : 'Bank Statement (CSV)',
    chooseFile: isKn
      ? (sourceType === 'receipt' ? 'ರಸೀದಿ ಅಥವಾ ಬಿಲ್ ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ' : 'CSV ಬ್ಯಾಂಕ್ ಹೇಳಿಕೆ ಆಯ್ಕೆಮಾಡಿ')
      : (sourceType === 'receipt' ? 'Choose or drag & drop a receipt or invoice' : 'Choose or drag & drop a CSV bank statement'),
    fileHint: isKn
      ? (sourceType === 'receipt' ? 'JPG, PNG, WEBP, ಅಥವಾ PDF — 10MB ವರೆಗೆ' : 'CSV ಫೈಲ್ — 10MB ವರೆಗೆ')
      : (sourceType === 'receipt' ? 'JPG, PNG, WEBP, or PDF up to 10MB' : 'CSV format up to 10MB'),
    analyzeBtn: isKn ? 'ಡಾಕ್ಯುಮೆಂಟ್ ವಿಶ್ಲೇಷಿಸಿ' : 'Analyze Document',
    analyzingBtn: isKn ? 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...' : 'Analyzing document...',
    fileSizeError: isKn ? 'ಫೈಲ್ ಗಾತ್ರ 10 MB ಮಿತಿಯನ್ನು ಮೀರಿದೆ' : 'File size exceeds 10 MB limit',
    found: isKn ? 'ಕಂಡುಬಂದವು:' : 'Found:',
    duplicates: isKn ? 'ನಕಲಿ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ' : 'duplicate(s) unticked',
    selected: isKn ? 'ಆಯ್ಕೆಮಾಡಿದವು:' : 'Selected:',
    total: isKn ? 'ಒಟ್ಟು:' : 'Total:',
    discardBtn: isKn ? 'ರದ್ದುಮಾಡಿ, ಮತ್ತೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Discard & Re-upload',
    thSelect: isKn ? 'ಆಯ್ಕೆ' : 'Select',
    thDate: isKn ? 'ದಿನಾಂಕ' : 'Date',
    thMerchant: isKn ? 'ಅಂಗಡಿ / ಹೆಸರು' : 'Merchant',
    thAmount: isKn ? 'ಹಣ (₹)' : 'Amount (₹)',
    thCategory: isKn ? 'ವಿಭಾಗ' : 'Category',
    thNotes: isKn ? 'ಟಿಪ್ಪಣಿ' : 'Notes',
    thAction: isKn ? 'ಕ್ರಿಯೆ' : 'Action',
    duplicate: isKn ? 'ನಕಲಿ' : 'Duplicate',
    learned: isKn ? 'ಕಲಿತಿದೆ' : 'Learned',
    notesPlaceholder: isKn ? 'ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ' : 'Optional notes',
    cancelBtn: isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel',
    importingBtn: isKn ? 'ದಾಖಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Importing...',
    confirmBtn: (count) => isKn
      ? `${count} ಲೆಕ್ಕ(ಗಳನ್ನು) ಖಚಿತಪಡಿಸಿ ಮತ್ತು ಸೇರಿಸಿ`
      : `Confirm & Import ${count} Transaction(s)`,
    failAnalyze: isKn ? 'ಡಾಕ್ಯುಮೆಂಟ್ ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Failed to process document. Please try again.',
    failConfirm: isKn ? 'ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' : 'Failed to confirm transaction import.',
    successDefault: isKn ? 'ಲೆಕ್ಕಗಳು ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾದವು!' : 'Transactions imported successfully!',
  };

  const categoryLabel = (c) => {
    const key = `categories.${c}`;
    const translated = t(key);
    return translated !== key ? translated : c;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMessage(tx.fileSizeError);
        return;
      }
      setFile(selected);
      setErrorMessage('');
      setDraftData(null);
      setSuccessMessage('');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) return;

    setAnalyzing(true);
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDraftData(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || tx.failAnalyze;
      setErrorMessage(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleRow = (index) => {
    setDraftData((prev) => {
      const nextTx = [...prev.transactions];
      nextTx[index] = { ...nextTx[index], selected: !nextTx[index].selected };
      return { ...prev, transactions: nextTx };
    });
  };

  const handleFieldChange = (index, field, value) => {
    setDraftData((prev) => {
      const nextTx = [...prev.transactions];
      nextTx[index] = { ...nextTx[index], [field]: value };
      return { ...prev, transactions: nextTx };
    });
  };

  const handleRemoveRow = (index) => {
    setDraftData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index),
    }));
  };

  const handleConfirm = async () => {
    if (!draftData?.transactions?.length) return;

    setConfirming(true);
    setErrorMessage('');

    try {
      const res = await api.post('/uploads/confirm', {
        source: draftData.source || sourceType,
        transactions: draftData.transactions,
      });

      setSuccessMessage(res.data.message || tx.successDefault);
      setDraftData(null);
      setFile(null);
      if (onConfirmSuccess) onConfirmSuccess();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || tx.failConfirm);
    } finally {
      setConfirming(false);
    }
  };

  const selectedCount = draftData?.transactions?.filter((r) => r.selected)?.length || 0;
  const selectedTotal =
    draftData?.transactions
      ?.filter((r) => r.selected)
      ?.reduce((s, r) => s + (Number(r.amount) || 0), 0) || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            {tx.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {tx.subtitle}
          </p>
        </div>

        {/* Source Type Selector */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => { setSourceType('receipt'); setDraftData(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[44px] ${
              sourceType === 'receipt'
                ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tx.receiptTab}
          </button>
          <button
            type="button"
            onClick={() => { setSourceType('statement'); setDraftData(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[44px] ${
              sourceType === 'statement'
                ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tx.statementTab}
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Upload Form */}
      {!draftData && (
        <form onSubmit={handleAnalyze} className="mt-6">
          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 dark:border-slate-700 dark:hover:border-indigo-400 dark:hover:bg-indigo-950/10 transition-colors">
            <UploadCloud className="h-10 w-10 text-slate-400 dark:text-slate-500 mb-2" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {file ? file.name : tx.chooseFile}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {tx.fileHint}
            </span>
            <input
              type="file"
              onChange={handleFileChange}
              accept={sourceType === 'receipt' ? 'image/jpeg,image/png,image/webp,application/pdf' : '.csv,text/csv'}
              className="hidden"
            />
          </label>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={!file || analyzing}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {tx.analyzingBtn}
                </>
              ) : (
                <>
                  {tx.analyzeBtn}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Review & Edit Draft Table */}
      {draftData && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-300">
                {tx.found} <strong className="text-slate-900 dark:text-white">{draftData.transactions.length}</strong>
              </span>
              {draftData.duplicateCount > 0 && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800 font-semibold dark:bg-amber-950/60 dark:text-amber-300">
                  {draftData.duplicateCount} {tx.duplicates}
                </span>
              )}
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {tx.selected} {selectedCount} ({tx.total} ₹{selectedTotal.toLocaleString('en-IN')})
              </span>
            </div>

            <button
              type="button"
              onClick={() => { setDraftData(null); setFile(null); }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
            >
              {tx.discardBtn}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-3 w-10">{tx.thSelect}</th>
                  <th className="px-3 py-3">{tx.thDate}</th>
                  <th className="px-3 py-3">{tx.thMerchant}</th>
                  <th className="px-3 py-3">{tx.thAmount}</th>
                  <th className="px-3 py-3">{tx.thCategory}</th>
                  <th className="px-3 py-3">{tx.thNotes}</th>
                  <th className="px-3 py-3 w-10">{tx.thAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {draftData.transactions.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${row.selected ? '' : 'opacity-50 bg-slate-50/50 dark:bg-slate-800/20'} ${
                      row.isDuplicate ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => handleToggleRow(idx)}
                        className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleFieldChange(idx, 'date', e.target.value)}
                        className="w-32 rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 min-h-[44px]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.merchant}
                        onChange={(e) => handleFieldChange(idx, 'merchant', e.target.value)}
                        className="w-36 rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 min-h-[44px]"
                      />
                      {row.isDuplicate && (
                        <span className="block text-[10px] text-amber-600 font-semibold">{tx.duplicate}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.amount}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleFieldChange(idx, 'amount', Number(e.target.value))}
                        className="w-24 rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 min-h-[44px]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.category}
                        onChange={(e) => handleFieldChange(idx, 'category', e.target.value)}
                        className="w-36 rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 min-h-[44px]"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{categoryLabel(c)}</option>
                        ))}
                      </select>
                      {row.categoryOverridden && (
                        <span className="block text-[10px] text-indigo-600 font-medium">{tx.learned}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.notes || ''}
                        onChange={(e) => handleFieldChange(idx, 'notes', e.target.value)}
                        placeholder={tx.notesPlaceholder}
                        className="w-36 rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 min-h-[44px]"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-400 hover:text-red-500 p-2 min-h-[44px] min-w-[44px]"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setDraftData(null); setFile(null); }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 min-h-[44px]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming || selectedCount === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 min-h-[44px]"
            >
              {confirming ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {tx.importingBtn}
                </>
              ) : (
                tx.confirmBtn(selectedCount)
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
