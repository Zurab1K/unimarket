import sequelize from "@/lib/db";
import { DataTypes } from "sequelize";

const UserProfile = sequelize.define('UserProfile', {
    fullName: { type: DataTypes.STRING, allowNull: false },
    university: { type: DataTypes.STRING },
    campus: { type: DataTypes.STRING, allowNull: false},
    major_focus: { type : DataTypes.STRING, allowNull: false},
    // although each bubble option has both min and max we porlly should separate them
    budget_min: { type: DataTypes.INTEGER, allowNull: false},
    budget_max: { type: DataTypes.INTEGER, allowNull: false},
})

export default UserProfile;