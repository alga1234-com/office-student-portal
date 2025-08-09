const bcrypt = require('bcryptjs');

const users = [
  {
    name: 'Admin Name',
    username: 'admin10x',
    password: 'myaismud8812',
    regNo: '',
    studentNo: '',
    role: 'superuser',
    contact: '0781492126'
  },
  {
    name: 'Jane Staff',
    username: 'staff01',
    password: 'staffpass',
    regNo: 'REG002',
    studentNo: 'STU002',
    role: 'staff',
    contact: '0700000002'
  },
  {
    name: 'Alex Student',
    username: 'student01',
    password: 'studentpass',
    regNo: 'REG003',
    studentNo: 'STU003',
    role: 'student',
    contact: '0700000003'
  }
];

async function main() {
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(
      `INSERT INTO User_Table (name, Username, Password, RegNo, StudentNo, UserRole, Contact)\n` +
      `VALUES ('${user.name.replace(/'/g, "''")}', '${user.username}', '${hash}', '${user.regNo}', '${user.studentNo}', '${user.role}', '${user.contact}');\n`
    );
  }
}

main();