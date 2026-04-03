const { User } = require("../models");

const getAllUsers = async ({ page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await User.findAndCountAll({
    attributes: { exclude: ["password"] },
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const updateUser = async (id, updates, requestingUser) => {
  const user = await User.findByPk(id);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // A non-admin user can only update themselves, and cannot change their own role
  if (requestingUser.role !== "admin") {
    if (requestingUser.id !== user.id) {
      const error = new Error("You can only update your own profile.");
      error.statusCode = 403;
      throw error;
    }
    // Strip role and status from updates for non-admins
    delete updates.role;
    delete updates.status;
  }

  await user.update(updates);
  return user.toSafeObject();
};

const deleteUser = async (id, requestingUser) => {
  // Prevent admin from deleting themselves
  if (parseInt(id) === requestingUser.id) {
    const error = new Error("You cannot delete your own account.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(id);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Soft delete by setting status to inactive
  await user.update({ status: "inactive" });
  return { message: "User deactivated successfully." };
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
