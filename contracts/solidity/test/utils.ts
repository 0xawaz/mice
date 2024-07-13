export function formatToBytes32(value: string | number): Uint8Array {
    const byteArray = new Uint8Array(32); // Create a 32-byte array
    
    // Convert the value to a string if it's not already
    const stringValue = value.toString();
    
    // Convert the string to bytes and store them in the byte array
    for (let i = 0; i < stringValue.length && i < 32; i++) {
        byteArray[i] = stringValue.charCodeAt(i);
    }
    
    return byteArray;
}
