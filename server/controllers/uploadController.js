import { fileTypeFromBuffer } from 'file-type';
import Papa from 'papaparse';
import Transaction from '../models/Transaction.js';
import MerchantCategory from '../models/MerchantCategory.js';
import { parseDocumentWithGemini } from '../services/geminiService.js';
import { generateFingerprint } from '../utils/fingerprint.js';
import { encrypt } from '../utils/crypto.js';
import { AppError } from '../utils/AppError.js';
import { CATEGORIES } from '../utils/constants.js';
import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Row validation schema for extracted data
const extractedRowSchema = z.object({
  date: z.string().transform(val => {
    // Convert DD/MM/YYYY to YYYY-MM-DD if needed
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split('/');
      return `${y}-${m}-${d}`;
    }
    // Normalize ISO date strings to YYYY-MM-DD
    if (val.includes('T')) {
      return val.split('T')[0];
    }
    return val;
  }),
  merchant: z.string().min(1).max(200).trim(),
  amount: z.coerce.number().positive(),
  category: z.string().transform(val => {
    const lower = val.toLowerCase().trim();
    return CATEGORIES.includes(lower) ? lower : 'other';
  }),
  paymentMode: z.string().optional().default('other'),
  notes: z.string().optional().default(''),
});

// 1. ANALYZE FILE (Gemini or local PapaParse CSV)
export async function analyzeUpload(req, res, next) {
  try {
    if (!req.file?.buffer) {
      throw new AppError('No file uploaded', 400);
    }

    const { buffer, originalname, mimetype } = req.file;
    const isCsv =
      mimetype === 'text/csv' ||
      mimetype === 'application/vnd.ms-excel' ||
      originalname.toLowerCase().endsWith('.csv');

    let extractedRawRows = [];
    let source = 'receipt';

    if (isCsv) {
      source = 'statement';
      const csvString = buffer.toString('utf8');
      const parsed = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (!parsed.data || parsed.data.length === 0) {
        throw new AppError('CSV statement is empty or unreadable', 422);
      }

      // Map flexible CSV headers into uniform structure
      for (const row of parsed.data) {
        const keys = Object.keys(row);
        const findVal = patterns => {
          const key = keys.find(k => patterns.some(p => k.toLowerCase().includes(p)));
          return key ? row[key] : null;
        };

        const rawDate = findVal(['date', 'txn date', 'transaction date', 'time']);
        const rawMerchant = findVal(['merchant', 'description', 'narration', 'payee', 'particulars', 'name']);
        const rawAmount = findVal(['amount', 'debit', 'withdrawal', 'spent', 'dr']);
        const rawCategory = findVal(['category', 'tag']);
        const rawMode = findVal(['mode', 'type', 'channel', 'payment']);

        if (rawDate && rawMerchant && rawAmount) {
          extractedRawRows.push({
            date: String(rawDate).trim(),
            merchant: String(rawMerchant).trim(),
            amount: Math.abs(Number(String(rawAmount).replace(/[^0-9.-]+/g, ''))),
            category: rawCategory ? String(rawCategory) : 'other',
            paymentMode: rawMode ? String(rawMode).toLowerCase() : 'other',
            notes: `Imported from CSV statement: ${originalname}`,
          });
        }
      }
    } else {
      // Validate magic bytes for images/PDFs
      const detectedType = await fileTypeFromBuffer(buffer);
      if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
        throw new AppError(
          'Invalid file type. Only JPG, PNG, WEBP, PDF, and CSV files are allowed.',
          400
        );
      }

      extractedRawRows = await parseDocumentWithGemini(buffer, detectedType.mime);
    }

    // Drop invalid rows with Zod safeParse
    const validRows = [];
    for (const raw of extractedRawRows) {
      const result = extractedRowSchema.safeParse(raw);
      if (result.success) {
        validRows.push(result.data);
      }
    }

    if (validRows.length === 0) {
      throw new AppError('No valid transaction rows could be parsed from the document', 422);
    }

    // Apply learned MerchantCategory overrides
    const userId = req.user._id;
    const learnedOverrides = await MerchantCategory.find({ user: userId });
    const overrideMap = new Map(
      learnedOverrides.map(o => [o.merchant.toLowerCase().trim(), o.category])
    );

    for (const row of validRows) {
      const learned = overrideMap.get(row.merchant.toLowerCase().trim());
      if (learned) {
        row.category = learned;
        row.categoryOverridden = true;
      }
    }

    // Duplicate detection via fingerprint
    const fingerprints = validRows.map(r =>
      generateFingerprint(userId, r.date, r.amount, r.merchant)
    );

    const existingTxns = await Transaction.find({
      user: userId,
      fingerprint: { $in: fingerprints },
    }).select('fingerprint');

    const duplicateSet = new Set(existingTxns.map(t => t.fingerprint));

    const draftTransactions = validRows.map((row, idx) => {
      const fp = fingerprints[idx];
      const isDuplicate = duplicateSet.has(fp);
      return {
        ...row,
        fingerprint: fp,
        isDuplicate,
        selected: !isDuplicate, // Duplicate rows unchecked by default
      };
    });

    res.json({
      message: 'Document analyzed successfully (DRAFT ONLY)',
      source,
      totalExtracted: draftTransactions.length,
      duplicateCount: draftTransactions.filter(d => d.isDuplicate).length,
      transactions: draftTransactions,
    });
  } catch (err) {
    next(err);
  }
}

// 2. CONFIRM UPLOAD DRAFT
export async function confirmUpload(req, res, next) {
  try {
    const { transactions, source } = req.validated;
    const userId = req.user._id;

    // Filter to selected rows only
    const selectedRows = transactions.filter(t => t.selected !== false);
    if (selectedRows.length === 0) {
      return res.json({ message: 'No transactions selected for import', insertedCount: 0, skippedCount: 0 });
    }

    // Update / learn merchant categories from user confirmation
    const categoryUpdateOps = [];
    for (const row of selectedRows) {
      categoryUpdateOps.push({
        updateOne: {
          filter: { user: userId, merchant: row.merchant.toLowerCase().trim() },
          update: { category: row.category },
          upsert: true,
        },
      });
    }

    if (categoryUpdateOps.length > 0) {
      await MerchantCategory.bulkWrite(categoryUpdateOps, { ordered: false });
    }

    // Prepare transaction documents with encrypted notes
    const docsToInsert = selectedRows.map(row => ({
      user: userId,
      date: new Date(row.date),
      merchant: row.merchant,
      amount: row.amount,
      type: 'expense',
      category: row.category,
      paymentMode: row.paymentMode || 'other',
      notes: row.notes ? encrypt(row.notes) : '',
      source: source || 'receipt',
      fingerprint: generateFingerprint(userId, row.date, row.amount, row.merchant),
    }));

    let insertedCount = 0;
    let skippedCount = 0;

    try {
      const result = await Transaction.insertMany(docsToInsert, { ordered: false });
      insertedCount = result.length;
    } catch (insertErr) {
      // Catch duplicate key errors gracefully
      if (insertErr.insertedDocs) {
        insertedCount = insertErr.insertedDocs.length;
        skippedCount = docsToInsert.length - insertedCount;
      } else if (insertErr.code === 11000) {
        skippedCount = docsToInsert.length;
      } else {
        throw insertErr;
      }
    }

    res.status(201).json({
      message: `Successfully imported ${insertedCount} transactions (${skippedCount} duplicates skipped)`,
      insertedCount,
      skippedCount,
    });
  } catch (err) {
    next(err);
  }
}
