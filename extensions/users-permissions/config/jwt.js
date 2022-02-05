module.exports = {
  jwtSecret: process.env.JWT_SECRET || '057a2041-ffa5-4847-b385-07d308d9d9e5',
  jwt: {
    expiresIn: "9d",
  }
};