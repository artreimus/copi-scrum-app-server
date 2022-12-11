const NOTE_STATUS = {
  ToDo: 'To do',
  InProgress: 'In Progress',
  Testing: 'Testing',
  Done: 'Done',
};

const verifyNoteStatus = ({ startDate, endDate, status }) => {
  if (!status) {
    return false;
  }

  console.log(status, startDate);

  let flag = false;

  switch (status) {
    case NOTE_STATUS.ToDo:
      // if To do there should be no  start and end date
      flag = !startDate && !endDate;
      break;
    case NOTE_STATUS.InProgress:
    case NOTE_STATUS.Testing:
      // if In Progress/Testing there should be a start and no end date yet
      flag = startDate && !endDate;
      break;
    case NOTE_STATUS.Done:
      // if done there should be a start and end date
      flag = startDate && endDate;
      break;
    default:
      flag = false;
  }

  return flag;
};

module.exports = verifyNoteStatus;
