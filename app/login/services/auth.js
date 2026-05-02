export const loginUser = async (data) => {
  return {
    token: "fake-token",
    user: {
      role: "admin"
    }
  };
};
localStorage.setItem("token", "fake-token");