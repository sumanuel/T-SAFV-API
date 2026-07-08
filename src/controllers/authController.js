const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const register = async (req, res) => {
  const { nombre, apellido, email, password, telefono, rif_cedula, direccion } =
    req.body;
  try {
    const claimed = await userModel.claimReservedUser({
      nombre,
      apellido,
      email,
      password,
      telefono,
      rif_cedula,
      direccion,
    });

    if (claimed) {
      const access = await userModel.getAssociationCreationAccess({
        userId: claimed.user.id,
        email: claimed.user.email,
      });
      return res.status(200).json({
        message:
          "Cuenta activada. Este correo ya había sido registrado dentro de una asociación.",
        user: {
          ...claimed.user,
          association_creation_access: access,
        },
      });
    }

    const user = await userModel.createUser({
      nombre,
      apellido,
      email,
      password,
      telefono,
      rif_cedula,
      direccion,
    });
    const access = await userModel.getAssociationCreationAccess({
      userId: user.id,
      email: user.email,
    });
    res.status(201).json({
      message: "User created successfully",
      user: {
        ...user,
        association_creation_access: access,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "El correo ya está registrado. Si fue creado por una asociación, espera la invitación oficial o usa ese mismo correo para activar tu cuenta.",
      });
    }
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const access = await userModel.getAssociationCreationAccess({
      userId: user.id,
      email: user.email,
    });

    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol || "ADMIN",
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rif_cedula: user.rif_cedula,
        direccion: user.direccion,
        association_creation_access: access,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        rol: user.rol || "ADMIN",
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        rif_cedula: user.rif_cedula,
        direccion: user.direccion,
        association_creation_access: access,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

const getAssociationCreationAccessCurrent = async (req, res) => {
  try {
    const user = await userModel.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const access = await userModel.getAssociationCreationAccess({
      userId: user.id,
      email: user.email,
    });
    res.json(access);
  } catch (error) {
    res.status(500).json({
      message: "Error loading association creation access",
      error: error.message,
    });
  }
};

const updatePushToken = async (req, res) => {
  const userId = req.user.id;
  const { push_token } = req.body;
  if (!push_token) {
    return res.status(400).json({ message: "push_token requerido" });
  }
  try {
    await userModel.updatePushToken(userId, push_token);
    res.json({ message: "Push token actualizado" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error actualizando push token", error: error.message });
  }
};

module.exports = {
  register,
  login,
  getAssociationCreationAccessCurrent,
  updatePushToken,
};
