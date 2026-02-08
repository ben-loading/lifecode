declare module 'opencc-js' {
  export interface ConverterOptions {
    from: 'cn' | 'tw' | 'hk' | 'jp'
    to: 'cn' | 'tw' | 'hk' | 'jp'
  }

  export interface Converter {
    (text: string): string
  }

  export function Converter(options: ConverterOptions): Converter
}
