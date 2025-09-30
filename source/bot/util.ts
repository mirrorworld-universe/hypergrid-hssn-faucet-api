export function assert_is_not_empty(value: any, message: string) {
    if (value == null || value == undefined || value === "") {
        throw new Error(message);
    }
}