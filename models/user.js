// contains commonly used functions
export const User = {
  getAll: async () => {
    /* fetching/transformation logic for all users */
    const all_users = await _db("staff");
  },
  getById: (id) => {
    /* fetching/transformation logic for a single user */
  },
  getByGroupId: (id) => {
    /* fetching/transformation logic for a group of users */
  },
};
