declare module 'vtex.styleguide' {
  import { ComponentType } from 'react'
  export const Button: ComponentType<InputProps>
  export const Dropdown: ComponentType<InputProps>
  export const Input: ComponentType<InputProps>
  export const Table: ComponentType<InputProps>

  interface InputProps {
    [key: string]: any
  }
}
