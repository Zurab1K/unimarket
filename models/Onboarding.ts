import sequelize from "@/lib/db";
import { DataTypes } from "sequelize";

const Onboarding = sequelize.define('Onboarding', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    created_at: {
        type: DataTypes.STRING,
        allowNull: false
    }
});