const transactionService = require("../services/transactionService");

const getAllTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, search, page, limit } = req.query;
    const result = await transactionService.getAllTransactions(
      { type, category, startDate, endDate, search },
      { page, limit }
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.body, req.user.id);
    res.status(201).json({ success: true, message: "Transaction created.", data: transaction });
  } catch (err) {
    next(err);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);
    res.status(200).json({ success: true, message: "Transaction updated.", data: transaction });
  } catch (err) {
    next(err);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.deleteTransaction(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
