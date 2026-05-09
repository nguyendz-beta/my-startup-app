export const paginate = (page = 1, per = 20) => ({
  skip: (page - 1) * per,
  take: per,
});
