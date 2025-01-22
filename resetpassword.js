"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
async function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = (0, crypto_1.randomBytes)(16).toString('hex');
        (0, crypto_1.pbkdf2)(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
            if (err)
                reject(err);
            resolve('pbkdf2:' + salt + ':' + derivedKey.toString('hex'));
        });
    });
}
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        const password = await hashPassword('123456');
        const accounts = await prisma.accounts.findFirst({
            where: { role: 'superadmin' }
        });
        await prisma.accounts.update({
            where: { id: accounts === null || accounts === void 0 ? void 0 : accounts.id },
            data: { password }
        });
    }
    catch (error) {
        console.log(error);
    }
}
main()
    .then(e => {
    console.log("✨ Reset password done! Your password is 123456 ✨");
})
    .catch((e) => {
    console.error(e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
