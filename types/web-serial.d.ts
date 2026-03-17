/**
 * Type declarations for Web Serial API
 * @see https://wicg.github.io/serial/
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API
 */

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

type ParityType = "none" | "even" | "odd";
type FlowControlType = "none" | "hardware";

interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: ParityType;
  bufferSize?: number;
  flowControl?: FlowControlType;
}

interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
  getInfo(): SerialPortInfo;
}

interface SerialPortEvent extends Event {
  readonly target: SerialPort;
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  addEventListener(
    type: "connect" | "disconnect",
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: "connect" | "disconnect",
    listener: (event: Event) => void,
    options?: boolean | EventListenerOptions
  ): void;
}

interface Navigator {
  readonly serial: Serial;
}
