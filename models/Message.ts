import { DataTypes } from "sequelize";
import sequelize from "@/lib/db";


// Using references to establish foreign key relationship -> user table

const Message = sequelize.define("Message",
    {
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        receiverId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            },
            conversationId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "messages",
        timestamps: true,
    }
);

export default Message;
