import sequelize from "@/lib/db";
import { DataTypes } from "sequelize";

const User = sequelize.define('User', {
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    // for now not gonna hash. Maybe later
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    university: { type: DataTypes.STRING },
})

export default User;