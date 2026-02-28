// This is where we are going to initialize our database connection
import { Sequelize } from "sequelize";

// Declare type for the cached connection since TS does not know what properties in global
declare global {
    // eslint-disable-next-line no-var
    var sequelizeCache: Sequelize | undefined
}

// Get the DATABASE STRING
const DATABASE = process.env.DATABASE;

if (!DATABASE){
    throw new Error("DATABASE URL not valid");
}

let sequelize: Sequelize;

// Check if it is in cache. Althought SQL handles connection pooling automatically, sometimes when next.js performs hot reloads
// we might create multiple connections.
if (!global.sequelizeCache){
    sequelize = new Sequelize(DATABASE, {
        dialect: 'postgres',
        logging: false
    });
    global.sequelizeCache = sequelize;
} else {
    sequelize = global.sequelizeCache;
}

export async function dbConnection(){
    try {
        await sequelize.authenticate();
        console.log("Database connected!");
        return sequelize;
    } catch(err){
        console.error("Database failed to connect!", err);
        throw err;
    }

}

export default sequelize;
