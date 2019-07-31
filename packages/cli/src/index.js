/**
 * Log message
 */
const msg = "Webiny CLI";
export default (print = true) => {
    if (print) {
        console.log(msg);
    }

    return msg;
};
