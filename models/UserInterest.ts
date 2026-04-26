import sequelize from "@/lib/db";
import { DataTypes } from "sequelize";

const UserInterest = sequelize.define('UserInterest', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
})

export default UserInterest;