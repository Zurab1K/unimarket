import { DataTypes } from "sequelize";
import sequelize from "@/lib/db";

const Listing = sequelize.define('Listing',{
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    condition: {
        type: DataTypes.ENUM('new', 'like-new', 'good', 'fair', 'poor'),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('available', 'sold', 'reserved'),
        defaultValue: 'available'
    },
    images: {
        type: DataTypes.JSON,  // Store array of image URLs as JSON
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isNegotiable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Foreign key to User
    sellerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
        model: 'users',  // table name (lowercase plural)
        key: 'id'
    }
  }
}, {
    tableName: "listings",
    timestamps: true
});

export default Listing;