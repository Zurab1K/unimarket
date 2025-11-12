import { DataTypes } from "sequelize";
import sequelize from "@/lib/db";

const Review = sequelize.define("Review",
    {
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        reviewerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        reviewedUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "listings",
                key: "id",
            },
        },
    },
    {
        tableName: "reviews",
        timestamps: true,
    }
);

export default Review;
