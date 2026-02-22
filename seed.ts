import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const db = new Database("database.sqlite");

const orgId = uuidv4();
const userId = uuidv4();
const email = 'brianmagagula5@gmail.com';
const password = 'Brian7350$@#';
const hashedPassword = bcrypt.hashSync(password, 10);

const insertOrg = db.prepare("INSERT INTO organizations (id, name) VALUES (?, ?)");
const insertUser = db.prepare("INSERT INTO users (id, organization_id, email, password_hash) VALUES (?, ?, ?, ?)");

const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
if (!user) {
    db.transaction(() => {
        insertOrg.run(orgId, "Default Organization");
        insertUser.run(userId, orgId, email, hashedPassword);
    })();
    console.log("Successfully created user: " + email);
} else {
    console.log("User already exists: " + email);
}
