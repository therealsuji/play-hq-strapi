const STATES = {
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  CONFIRMED: "CONFIRMED",
  NOT_COMPLETE: "NOT_COMPLETE",
  DISPATCHED: "DISPATCHED",
  NOT_SELECTED: "NOT_SELECTED",
};
const SALE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const NOTIFICATION_TYPE = {
  INFO: "INFO",
  WARNING: "WARNING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
};

module.exports = { STATES, NOTIFICATION_TYPE, SALE_STATUS };
