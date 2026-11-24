import Transaction from '../models/Transaction.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { generateFingerprint } from '../utils/fingerprint.js';
import { AppError } from '../utils/AppError.js';
import Papa from 'papaparse';

function formatTransaction(tx) {
  const doc = tx.toObject ? tx.toObject() : { ...tx };
  if (doc.notes) {
    try {
      doc.notes = decrypt(doc.notes);
    } catch (_err) {
      // Keep as-is if decrypt fails or plaintext
    }
  }
  return doc;
}

// 1. CREATE TRANSACTION
export async function createTransaction(req, res, next) {
  try {
    const { date, merchant, amount, type, category, paymentMode, notes, recurring } = req.validated;
    const userId = req.user._id;

    const fingerprint = generateFingerprint(userId, date, amount, merchant);
    const existing = await Transaction.findOne({ user: userId, fingerprint });
    if (existing) {
      throw new AppError('A matching transaction already exists (duplicate detected)', 409);
    }

    const encryptedNotes = notes ? encrypt(notes) : '';

    const transaction = await Transaction.create({
      user: userId,
      date,
      merchant,
      amount,
      type,
      category,
      paymentMode: paymentMode || 'other',
      notes: encryptedNotes,
      source: 'manual',
      recurring,
      fingerprint,
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: formatTransaction(transaction),
    });
  } catch (err) {
    next(err);
  }
}

// 2. GET ALL TRANSACTIONS (Filtered, Paginated, Sorted)
export async function getTransactions(req, res, next) {
  try {
    const { page, limit, search, category, type, startDate, endDate, sortBy, sortOrder } = req.validatedQuery;
    const userId = req.user._id;

    const filter = { user: userId };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (search) {
      filter.merchant = { $regex: search, $options: 'i' };
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions: transactions.map(formatTransaction),
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

// 3. GET SINGLE TRANSACTION (Ownership enforced)
export async function getTransactionById(req, res, next) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({ transaction: formatTransaction(transaction) });
  } catch (err) {
    next(err);
  }
}

// 4. UPDATE TRANSACTION (Ownership enforced)
export async function updateTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    const updates = req.validated;
    if (updates.date !== undefined) transaction.date = updates.date;
    if (updates.merchant !== undefined) transaction.merchant = updates.merchant;
    if (updates.amount !== undefined) transaction.amount = updates.amount;
    if (updates.type !== undefined) transaction.type = updates.type;
    if (updates.category !== undefined) transaction.category = updates.category;
    if (updates.paymentMode !== undefined) transaction.paymentMode = updates.paymentMode;
    if (updates.recurring !== undefined) transaction.recurring = updates.recurring;

    if (updates.notes !== undefined) {
      transaction.notes = updates.notes ? encrypt(updates.notes) : '';
    }

    // Update fingerprint if key attributes changed
    transaction.fingerprint = generateFingerprint(
      req.user._id,
      transaction.date,
      transaction.amount,
      transaction.merchant
    );

    await transaction.save();

    res.json({
      message: 'Transaction updated successfully',
      transaction: formatTransaction(transaction),
    });
  } catch (err) {
    next(err);
  }
}

// 5. DELETE TRANSACTION (Ownership enforced)
export async function deleteTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// 6. EXPORT CSV
export async function exportTransactionsCsv(req, res, next) {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });

    const rows = transactions.map(tx => {
      const formatted = formatTransaction(tx);
      return {
        Date: new Date(formatted.date).toISOString().split('T')[0],
        Merchant: formatted.merchant,
        Amount: formatted.amount,
        Type: formatted.type,
        Category: formatted.category,
        PaymentMode: formatted.paymentMode,
        Notes: formatted.notes || '',
        Source: formatted.source,
      };
    });

    const csv = Papa.unparse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}
