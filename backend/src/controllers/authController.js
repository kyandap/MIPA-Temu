const { registerUser } = require('../services/authService');
const { loginUser } = require('../services/loginService');

async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);

    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
};