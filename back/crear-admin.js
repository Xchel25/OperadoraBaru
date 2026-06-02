const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const p = new PrismaClient();

p.user.create({
  data: {
    name: 'Administrador',
    email: 'admin@operadorabaru.com',
    password: bcrypt.hashSync('Admin2026!', 10),
    role: 'PROJECT_MANAGER',
    active: true,
    firstLogin: false
  }
}).then(u => console.log('Admin creado:', u.email))
  .catch(e => console.error('Error:', e.message))
  .finally(() => p.$disconnect());
