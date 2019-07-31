/**
 * Log message
 */
const msg = "Webiny CLI";

export const logger = (print = true) => {
    if (print) {
        console.log(msg);
    }

    return msg;
};

export default logger;
