const validateDates = (startDate, endDate) => {
  return new Date(startDate).getTime() < new Date(endDate).getTime();
};

module.exports = validateDates;
