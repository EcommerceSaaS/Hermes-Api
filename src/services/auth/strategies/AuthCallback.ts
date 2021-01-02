import { User } from "../../../api/users/UserModel";
export const callback = async (
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: (error: any, user?: any, info?: any) => void
) => {
  try {
    let user = await User.findOne({
      email: profile.emails!![0].value,
    });
    if (user) {
      return done(null, user);
    }

    user = new User({
      profilePhoto: profile.picture,
      name: profile.name,
      email: profile.emails!![0].value,
    });
    await user.save();
    return done(null, user);
  } catch (error) {
    console.log(error);
    done(null, false, { message: "Auth failed" });
  }
};
