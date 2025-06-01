/**
 * 将JSON对象直接转换为ArrayBuffer
 * @param jsonObject 要转换的JSON对象
 * @returns 包含JSON数据的ArrayBuffer
 */
export function json2ArrayBuffer(jsonObject: any): ArrayBuffer {
  // 1. 将JSON对象转换为字符串
  const jsonString = JSON.stringify(jsonObject);

  // 2. 创建一个TextEncoder来将字符串转换为Uint8Array
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(jsonString);
  const newBuffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(newBuffer).set(uint8Array);
  return newBuffer;
}