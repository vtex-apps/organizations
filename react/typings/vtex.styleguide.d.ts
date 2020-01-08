declare module 'vtex.styleguide' {
  import { ComponentType } from 'react'
  export const Button: ComponentType<InputProps>
  export const Dropdown: ComponentType<InputProps>
  export const Input: ComponentType<InputProps>
  export const Table: ComponentType<InputProps>
  export const EmptyState: ComponentType<InputProps>
  export const PageHeader: ComponentType<InputProps>
  export const Layout: ComponentType<InputProps>
  export const PageBlock: ComponentType<InputProps>

  interface InputProps {
    [key: string]: any
  }
}
