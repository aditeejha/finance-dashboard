const { Op } = require("sequelize");
const { Transaction, User } = require("../models");

// Build a WHERE clause from query parameters
const buildFilters = ({ type, category, startDate, endDate, search }) => {
  const where = { isDeleted: false };

  if (type) where.type = type;
  if (category) where.category = { [Op.like]: `%${category}%` };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  // Full-text search across category and notes fields
  if (search) {
    where[Op.or] = [
      { category: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ];
  }

  return where;
};

const getAllTransactions = async (filters, { page = 1, limit = 10 }) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where = buildFilters(filters);

  const { count, rows } = await Transaction.findAndCountAll({
    where,
    include: [{ model: User, as: "creator", attributes: ["id", "name", "email"] }],
    limit: parseInt(limit),
    offset,
    order: [["date", "DESC"]],
  });

  return {
    transactions: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getTransactionById = async (id) => {
  const transaction = await Transaction.findOne({
    where: { id, isDeleted: false },
    include: [{ model: User, as: "creator", attributes: ["id", "name", "email"] }],
  });

  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }

  return transaction;
};

const createTransaction = async (data, userId) => {
  const transaction = await Transaction.create({ ...data, createdBy: userId });
  return transaction;
};

const updateTransaction = async (id, data) => {
  const transaction = await Transaction.findOne({ where: { id, isDeleted: false } });

  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }

  await transaction.update(data);
  return transaction;
};

const deleteTransaction = async (id) => {
  const transaction = await Transaction.findOne({ where: { id, isDeleted: false } });

  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }

  // Soft delete — mark as deleted, not removed from DB
  await transaction.update({ isDeleted: true });
  return { message: "Transaction deleted successfully." };
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
