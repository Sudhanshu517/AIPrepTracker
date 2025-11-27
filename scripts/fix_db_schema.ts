import { pool } from "../server/db";

async function main() {
    try {
        console.log("Attempting to alter table problems...");
        const client = await pool.connect();
        await client.query('ALTER TABLE problems ALTER COLUMN category DROP NOT NULL');
        console.log("Successfully altered column category to be nullable.");
        client.release();
        process.exit(0);
    } catch (error) {
        console.error("Error altering table:", error);
        process.exit(1);
    }
}

main();
