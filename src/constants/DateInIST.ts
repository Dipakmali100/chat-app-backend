export default function DateInIST(){
    const date = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));

    return date.toISOString();
}