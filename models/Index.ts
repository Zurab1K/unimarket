import UserProfile from "./UserProfile";
import Interest from "./Interest";
import UserInterest from "./UserInterest";

UserProfile.belongsToMany(Interest, { through: UserInterest });
Interest.belongsToMany(UserProfile, { through: UserInterest });

export { UserProfile, Interest, UserInterest };

