// Here in this function I will pass the date and time and return the formatted time
// if time and date are of today then return time + AM or PM
// if time and date are of yesterday then return "Yesterday"
// if time and date are of other days then return date
export default function formattedTime(time: Date) {
    const date = new Date(time);
    const today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    const yesterday = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    yesterday.setDate(today.getDate() - 1);
    
    // get the hours, minutes, and am or pm from the date for creating the formatted time
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const amOrPm = hours >= 12 ? "PM" : "AM";
    const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? "0" : ""}${minutes} ${amOrPm}`;

    let timeAndDate = {
        showTime: formattedTime,
        showDate: "",
    }

    if (date.toUTCString() === today.toUTCString()) {
        timeAndDate.showDate = "Today";
    } else if (date.toUTCString() === yesterday.toUTCString()) {
        timeAndDate.showDate = "Yesterday";
    } else {
        timeAndDate.showDate = date.getUTCDate() + "/" + (date.getUTCMonth() + 1) + "/" + date.getUTCFullYear();
    }

    return timeAndDate;
}